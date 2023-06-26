'use strict';

const { Device } = require('homey');
const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER, Cluster, debug } = require('zigbee-clusters');

// Enable debug logging of all relevant Zigbee communication
debug(true);

class EvaDoorWindowSensor extends ZigBeeDevice {

  async onNodeInit({zclNode, node}) {
    this.log(this.getName() + ' has been initialized');
    console.log(this.getCapabilities())

    zclNode.endpoints[1].clusters.iasZone.onZoneEnrollRequest = () => {
      this.log("Zone enroll request")
      this.log(this.zclNode.endpoints[1].clusters.iasZone)
      zclNode.endpoints[1].clusters.iasZone.zoneEnrollResponse({
        enrollResponseCode: 0,
        zoneId: 245
      })
    }

    if (!this.hasCapability('alarm_magnet_contact')) {
      this.log("Add alarm_magnet_contact capability")
      await this.addCapability('alarm_magnet_contact')
    }
/*
    await this.configureAttributeReporting([
      {
        endpointId: 1,
        cluster: CLUSTER.IAS_ZONE,
        attributeName: "zoneStatus",
        minInterval: 50,
        maxInterval: 3600,
        reportableChange: 0,
      },
    ]);
*/
    /*
    this.registerCapability('alarm_magnet_contact', CLUSTER.IAS_ZONE, {
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
    })

     */
    node.handleFrame = (endpointId, clusterId, frame, meta) => {
      this.log("Receiving frame")
      this.log("Cluster: " + clusterId)

      this.log(frame)
      this.setAvailable()
      if (clusterId === 1280 && frame[6] === 53) {
        if (this.getCapabilityValue("alarm_magnet_contact") === false) {
          this.triggerFlow({ id: 'alarm_magnet_contact_opened' })
              .then(() => this.log(`Flow triggered: alarm_magnet_contact_opened`))
              .catch(err => this.error(`Error triggering flow: alarm_magnet_contact_opened`, err));
        }
        this.setCapabilityValue('alarm_magnet_contact', true).catch(this.error)
      } else {
        if (this.getCapabilityValue("alarm_magnet_contact") === true) {
          this.triggerFlow({ id: 'alarm_magnet_contact_closed' })
              .then(() => this.log(`Flow triggered: alarm_magnet_contact_closed`))
              .catch(err => this.error(`Error triggering flow: alarm_magnet_contact_closed`, err));
        }
        this.setCapabilityValue('alarm_magnet_contact', false).catch(this.error)


      }
    }

    /*
    zclNode.endpoints[1].clusters.iasZone.on(
        'attr.zoneStatus', value => {
          //Handle reported attribute value
          if (value.alarm1) {
            this.setCapabilityValue('alarm_magnet_contact', true).catch(this.error)
          } else {
            this.setCapabilityValue('alarm_magnet_contact', false).catch(this.error)
          }
        });

     */


    // Capability Alarm_battery
    /*
    if (this.hasCapability('alarm_battery')) {
      this.batteryThreshold = 20;
      this.registerCapability('alarm_battery', CLUSTER.POWER_CONFIGURATION, {
        reportOpts: {
          configureAttributeReporting: {
            minInterval: 6000, // No minimum reporting interval
            maxInterval: 60000, // Maximally every ~24 hours
            minChange: 2, // Report when value changed by 2%
          },
        },
      });
    }

     */
/*
    // Capability measure_battery
    if (this.hasCapability('measure_battery')) {
      this.registerCapability('measure_battery', CLUSTER.POWER_CONFIGURATION, {
        reportOpts: {
          configureAttributeReporting: {
            minInterval: 6000,
            maxInterval: 60000,
            minChange: 1,
          },
        },
      });
    }*/

    /*
    // Capability measure_temperature
    if (this.hasCapability('measure_temperature')) {
      this.registerCapability('measure_temperature', CLUSTER.TEMPERATURE_MEASUREMENT, {
        reportOpts: {
          configureAttributeReporting: {
            minInterval: 1800, // No minimum reporting interval
            maxInterval: 3600, // Maximally every ~1 hours
            minChange: 100, // Report when value changed by 1c
          },
        },
      });
    }

     */

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

module.exports = EvaDoorWindowSensor;
