'use strict';

const { debug, CLUSTER} = require('zigbee-clusters')
const { ZigBeeDevice } = require('homey-zigbeedriver')
debug(true)
class WaterSensorDevice extends ZigBeeDevice {

  async onNodeInit({zclNode, node}) {
    this.log(this.getName() + ' has been initialized');
    console.log(this.getCapabilities())
    let alarmCapabilityId = "alarm_water"

    // Send iasZone enrollment request
    zclNode.endpoints[1].clusters.iasZone.onZoneEnrollRequest = () => {
      this.log("Zone enroll request")
      this.log(this.zclNode.endpoints[1].clusters.iasZone)
      zclNode.endpoints[1].clusters.iasZone.zoneEnrollResponse({
        enrollResponseCode: 0,
        zoneId: 250
      }).catch(err => this.error(`Could not complete iasZoneEnrollment`, err))
    }

    // Add custom capability alarm_water_contact if it isn't already added
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
