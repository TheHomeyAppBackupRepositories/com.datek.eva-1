'use strict';

const { CLUSTER } = require('zigbee-clusters');
const { ZigBeeDevice } = require('homey-zigbeedriver');


class SceneSelector extends ZigBeeDevice {
  /**
   * onInit is called when the device is initialized.
   */
  async onInit(){
    this.log('SceneSelector has been initialized');
    const node = await this.homey.zigbee.getNode(this);
    node.handleFrame = (endpointId, clusterId, frame, meta) => {
      //The command sent using the button
      var command = frame[2];
      //this.log(frame);
      //this.log("clusterId: " + clusterId);
      //If cluster is onOff (id=6)
      if (endpointId === 1 && clusterId === 6) {
        this.log("On/Off button was clicked");
        if(command === 0){
          this.log("Command: off");
          
         
          this.triggerFlow({ id: 'off' })
            .then(() => this.log(`flow was triggered: off`))
            .catch(err => this.error(`Error: triggering flow: off`, err));
        } else if(command === 1){
          this.log("Command: on");
          this.triggerFlow({ id: 'on' })
            .then(() => this.log(`flow was triggered: on`))
            .catch(err => this.error(`Error: triggering flow: on`, err));
        } 
      }
      //If cluster is levelControl (id=8)
      if (endpointId === 1 && clusterId === 8) {
        this.log("LevelControl button was clicked");
        this.log("commandId: " + command);  
        if(command === 1){
          //Move command
          this.triggerFlow({ id: 'off-held' })
            .then(() => this.log(`flow was triggered: off-held`))
            .catch(err => this.error(`Error: triggering flow: off-held`, err));
        } else if(command === 3){
          //Stop command
          this.triggerFlow({ id: 'off-released' })
            .then(() => this.log(`flow was triggered: off-released`))
            .catch(err => this.error(`Error: triggering flow: off-released`, err));

        }

        //Buttons 3 and 4: Sync dimmer values frame: 01 xx 04 ff ff ff
        
      }


      //If cluster is scenes(id=5)
      if (endpointId === 1 && clusterId === 5) {
        this.log("SceneButton was clicked!");
        command = frame[5];
        this.log("commandId: " + command);
        var scenarioId = frame[5];
        var lengthId = frame[2]; //Indicates how long the button was pressed
        if(lengthId === 5){//indicates short press
        if(scenarioId === 1){
          this.triggerFlow({ id: 'scenario1' })
              .then(() => this.log(`flow was triggered: scenario1`))
              .catch(err => this.error(`Error: triggering flow: scenario1`, err));
        } else if (scenarioId === 2) {
          this.triggerFlow({ id: 'scenario2' })
              .then(() => this.log(`flow was triggered: scenario2`))
              .catch(err => this.error(`Error: triggering flow: scenario2`, err));
        } else if (scenarioId === 3) {
          this.triggerFlow({ id: 'scenario3' })
              .then(() => this.log(`flow was triggered: scenario3`))
              .catch(err => this.error(`Error: triggering flow: scenario3`, err));
        } else if (scenarioId === 4) {
          this.triggerFlow({ id: 'scenario4' })
              .then(() => this.log(`flow was triggered: scenario4`))
              .catch(err => this.error(`Error: triggering flow: scenario4`, err));
        }
      } else if(lengthId === 4){//indicates long press
        if(scenarioId === 1){
          this.triggerFlow({ id: 'Save Scenario 1' })
              .then(() => this.log(`flow was triggered: Save Scenario 1`))
              .catch(err => this.error(`Error: triggering flow: Save Scenario 1`, err));
        } else if (scenarioId === 2) {
          this.triggerFlow({ id: 'Save Scenario 2' })
              .then(() => this.log(`flow was triggered: Save Scenario 2`))
              .catch(err => this.error(`Error: triggering flow: Save Scenario 2`, err));
        } else if (scenarioId === 3) {
          this.triggerFlow({ id: 'Save Scenario 3' })
              .then(() => this.log(`flow was triggered: Save Scenario 3`))
              .catch(err => this.error(`Error: triggering flow: Save Scenario 3`, err));
        } else if (scenarioId === 4) {
          this.triggerFlow({ id: 'Save Scenario4' })
              .then(() => this.log(`flow was triggered: Save Scenario4`))
              .catch(err => this.error(`Error: triggering flow: Save Scenario4`, err));
        }
      }

        } 
    };
  }


  async onNodeInit({zclNode}) {
    this.log('zclNode for SceneSelector has been initialized');

    //Add functionality for measuring temperature with the scene selector 
    this.registerCapability('measure_temperature', CLUSTER.TEMPERATURE_MEASUREMENT, {
			getOpts: {
				getOnStart: true,
			},
			reportOps: {
				configureAttributeReporting: {
					minInterval: 3,
					maxInterval: 5,
					minChange: 0,
					reportableChange: 0,
				}	
			}
		});

    //Adds functionality for display battery status for the scene seclector in the app
    this.batteryThreshold = 20;
    this.registerCapability('alarm_battery', CLUSTER.POWER_CONFIGURATION, {
      getOpts: {
        getOnStart: true,
      },
      reportOpts: {
        configureAttributeReporting: {
          minInterval: 3, 
          maxInterval: 5, 
          minChange: 0, 
        },
      },
    });


    await zclNode.endpoints[1].clusters[CLUSTER.POWER_CONFIGURATION.NAME].configureReporting({
			//Power measurement
			batteryVoltage: {
				minInterval: 5,
				maxInterval: 10,
				minChange: 0
			}
		  });

      zclNode.endpoints[1].clusters[CLUSTER.POWER_CONFIGURATION.NAME].on('attr.batteryVoltage', (batteryVoltage) => {
        //Handle reported attribute value
        this.log("Voltage left: " + batteryVoltage);
        //Multiplier is 1, divisor is 1000. 
     
        this.setCapabilityValue('alarm_battery', batteryVoltage).catch(this.error);
        });



  }





  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('SceneSelector has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('SceneSelector settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('SceneSelector was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('SceneSelector has been deleted');
  }
}

module.exports = SceneSelector;
