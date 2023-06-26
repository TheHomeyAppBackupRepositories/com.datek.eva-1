'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER, debug } = require('zigbee-clusters');

// Enable debug logging of all relevant Zigbee communication
debug(true);

class DatekContactSwitch extends ZigBeeDevice {

  async onNodeInit({zclNode, node}) {
    this.log(this.getName() + ' has been initialized');
    console.log(this.getCapabilities())
    let alarmCapabilityId = "alarm_contact"

    // Send iasZone enrollment request
    zclNode.endpoints[1].clusters.iasZone.onZoneEnrollRequest = () => {
      this.log("Zone enroll request")
      this.log(zclNode.endpoints[1].clusters.iasZone)
      zclNode.endpoints[1].clusters.iasZone.zoneEnrollResponse({
        enrollResponseCode: 0,
        zoneId: 245
      }).catch(err => this.error(`Could not complete iasZoneEnrollment`, err));
    }

    // Add custom capability alarm_magnet_contact if it isn't already added
    if (!this.hasCapability(alarmCapabilityId)) {
      this.log(`Add ${alarmCapabilityId} capability`)
      await this.addCapability(alarmCapabilityId).then( () => {
            this.registerCapabilityAlarm(alarmCapabilityId)
          }
      ).catch(err => this.error(`Could not add capability ${alarmCapabilityId}`, err))
    } else {
      this.registerCapabilityAlarm(alarmCapabilityId)
    }

    if (this.hasCapability('measure_temperature')) {
      this.registerCapability('measure_temperature', CLUSTER.TEMPERATURE_MEASUREMENT, {
        getOpts: {
          getOnOnline: true
        },
        get: 'measuredValue',
        getParser: value => (value + this.getSettings().offset)/100,
        report: 'measuredValue',
        reportParser: value => (value + this.getSettings().offset)/100,
        reportOps: {
          configureAttributeReporting: {
            minInterval: 300,
            maxInterval: 3600,
            reportableChange: 50
          }
        }
      });
    }

    if(this.hasCapability("alarm_battery")) {
      this.registerCapability('alarm_battery', CLUSTER.POWER_CONFIGURATION, {
        getOpts: {
          getOnOnline: true,
        },
        get: "batteryVoltage",
        report: "batteryVoltage",
        reportOpts: {
          configureAttributeReporting: {
            minInterval: 1800,
            maxInterval: 3600,
            minChange: 1,
          },
        },
      });

    }



  }

  registerCapabilityAlarm (capabilityId) {
    this.registerCapability(capabilityId, CLUSTER.IAS_ZONE, {
      get: 'zoneStatus',
      getParser: value => !!value.alarm1,
      report: 'zoneStatus',
      reportParser: value => !!value.alarm1,
      reportOpts: {
        configureAttributeReporting: {
          attributeName: 'zoneStatus',
          minInterval: 0,
          maxInterval: 3600,
          minChange: 0,
        },
      },
    })
  }





  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('Eva Door/window sensor has been added');
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
    this.log(`${this.getName()} settings were changed`);
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log(`${this.getName().toString() } was renamed to ${name}`);
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log(this.getName().toString() + ' has been deleted');
  }

}

module.exports = DatekContactSwitch;
