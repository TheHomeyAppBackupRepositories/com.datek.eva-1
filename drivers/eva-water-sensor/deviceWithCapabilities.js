'use strict';

const { CLUSTER, debug } = require('zigbee-clusters')
const { ZigBeeDevice } = require('homey-zigbeedriver')
debug(true)
class WaterSensorDevice extends ZigBeeDevice {

  async onNodeInit({zclNode, node}) {
    this.log(this.getName() + ' has been initialized');
    console.log(this.getCapabilities())

    zclNode.endpoints[1].clusters.iasZone.onZoneEnrollRequest = () => {
      this.log("Zone enroll request")
      this.log(this.zclNode.endpoints[1].clusters.iasZone)
      zclNode.endpoints[1].clusters.iasZone.zoneEnrollResponse({
        enrollResponseCode: 0,
        zoneId: 250
      })
    }

    if (!this.hasCapability('alarm_water_contact')) {
      this.log("Add alarm_water_contact capability")
      await this.addCapability('alarm_water_contact')
    }

    node.handleFrame = (endpointId, clusterId, frame, meta) => {
      this.log("Receiving frame")
      this.log("Cluster " + clusterId)
      this.log(frame)
      this.setAvailable()
      if (clusterId === 1280 && frame[6] === 49) {
        this.setCapabilityValue('alarm_water_contact', true).catch(this.error)
        this.triggerFlow({ id: 'alarm_water_contact_detected' })
            .then(() => this.log(`Flow triggered: alarm_water_contact_detected`))
            .catch(err => this.error(`Error triggering flow: alarm_water_contact_detected`, err));
      } else {
        this.setCapabilityValue('alarm_water_contact', false).catch(this.error)
      }
    }

/*
    await this.configureAttributeReporting([
      {
        endpointId: 1,
        cluster: CLUSTER.IAS_ZONE,
        attributeName: "zoneStatus",
        minInterval: 0,
        maxInterval: 3600,
        minChange: 0,
      },
    ]);

 */

    /*
    this.registerCapability('alarm_water_contact', CLUSTER.IAS_ZONE, {
      get: 'zoneStatus',
      report: 'zoneStatus',
      reportOpts: {
        configureAttributeReporting: {
          attributeName: 'zoneStatus',
          minInterval: 0,
          maxInterval: 3600,
          minChange: 0,
        },
      },
    })*/

/*
    zclNode.endpoints[1].clusters.iasZone.on(
        'attr.zoneStatus', value => {
          //Handle reported attribute value
          this.log(value)
          if (value.alarm1) {
            this.setCapabilityValue('alarm_water_contact', true).catch(this.error)
          } else {
            this.setCapabilityValue('alarm_water_contact', false).catch(this.error)
          }
        });

 */

/*
    this.registerCapability('measure_temperature', CLUSTER.TEMPERATURE_MEASUREMENT, {
      getOpts: {
        getOnStart: false,
      },
      getParser: value => parseFloat((value/100).toFixed(1)) + this.getSettings().offset,
      reportParser: value => parseFloat((value/100).toFixed(1)) + this.getSettings().offset,
      reportOps: {
        configureAttributeReporting: {
          minInterval: 300,
          maxInterval: 3600,
          reportableChange: 50
        }
      }
    });


    this.registerCapability('alarm_battery', CLUSTER.POWER_CONFIGURATION, {
      getOpts: {
        getOnStart: false,
      },
      reportOpts: {
        configureAttributeReporting: {
          minInterval: 1800,
          maxInterval: 3600,
          minChange: 0,
        },
      },
    });


    await zclNode.endpoints[1].clusters[CLUSTER.POWER_CONFIGURATION.NAME].configureReporting({
      //Power measurement
      batteryVoltage: {
        minInterval: 1800,
        maxInterval: 3600,
        minChange: 1
      }
    });

    zclNode.endpoints[1].clusters[CLUSTER.POWER_CONFIGURATION.NAME].on('attr.batteryVoltage', (batteryVoltage) => {
      //Handle reported attribute value
      this.log("Voltage left: " + batteryVoltage);
      //Multiplier is 1, divisor is 1000.

      this.setCapabilityValue('alarm_battery', batteryVoltage).catch(this.error);
    });

 */

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
    this.log('Water Sensor settings were changed')
    this.log(oldSettings)
    this.log(newSettings)
    this.log(changedKeys)


  }

}



module.exports = WaterSensorDevice;
