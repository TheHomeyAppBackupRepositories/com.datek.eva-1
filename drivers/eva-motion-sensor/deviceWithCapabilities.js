'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER, debug } = require('zigbee-clusters');
debug(true)

class EvaMotionSensor extends ZigBeeDevice {

  async onNodeInit({zclNode, node}) {
    this.log(this.getName() + ' has been initialized');
    console.log(this.getCapabilities())

    zclNode.endpoints[1].clusters.iasZone.onZoneEnrollRequest = () => {
      this.log("Zone enroll request")
      this.log(this.zclNode.endpoints[1].clusters.iasZone)
      zclNode.endpoints[1].clusters.iasZone.zoneEnrollResponse({
        enrollResponseCode: 0,
        zoneId: 255
      })
    }

    if (!this.hasCapability('alarm_motion_observed')) {
      this.log("Add alarm_motion_observed capability")
      await this.addCapability('alarm_motion_observed')
    }

    node.handleFrame = (endpointId, clusterId, frame, meta) => {
      this.log("Receiving frame")
      this.log("Cluster: " + clusterId)
      this.log(frame)
      this.setAvailable()
      if (frame[6] === 49) {
        if (this.getCapabilityValue("alarm_motion_observed") === false) {
          this.triggerFlow({ id: 'alarm_motion_observed_detected' })
              .then(() => this.log(`Flow triggered: alarm_motion_observed_detected`))
              .catch(err => this.error(`Error triggering flow: alarm_motion_observed_detected`, err));
        }
        this.setCapabilityValue('alarm_motion_observed', true).catch(this.error)
      } else if (frame[6] === 48) {
        this.setCapabilityValue('alarm_motion_observed', false).catch(this.error)
      } else {
        this.log("Something else happened")
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

    this.registerCapability('alarm_motion_observed', CLUSTER.IAS_ZONE, {
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


    zclNode.endpoints[1].clusters.iasZone.on(
        'attr.zoneStatus', value => {
          //Handle reported attribute value
          this.log(value)
          if (value.alarm1){
            this.setCapabilityValue('alarm_motion_observed', true).catch(this.error)
          } else {
            this.setCapabilityValue('alarm_motion_observed', false).catch(this.error)
          }
        });

     */

/*
    // Capability Measure Luminance
    if (this.hasCapability('measure_luminance')) {
      this.registerCapability('measure_luminance', CLUSTER.ILLUMINANCE_MEASUREMENT, {
        reportOpts: {
          configureAttributeReporting: {
            minInterval: 300,
            maxInterval: 3600,
            minChange: 100,
          },
        },
        getParser: value => {
          console.log(value)
          let lux = Math.pow(10, (value/10000)) - 1
          lux = parseFloat(lux.toString()).toFixed(2)
          return Number(parseFloat(lux.toString()).toFixed(2))
        },
        reportParser: value => {
          console.log(value)
          let lux = Math.pow(10, (value/10000)) - 1
          return Number(parseFloat(lux.toString()).toFixed(2))
        }
      });
    }

 */




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
    }

    // Capability measure_temperature
    if (this.hasCapability('measure_temperature')) {
      this.registerCapability('measure_temperature', CLUSTER.TEMPERATURE_MEASUREMENT, {
        reportOpts: {
          configureAttributeReporting: {
            minInterval: 300, // Min every 5 min
            maxInterval: 3600, // Maximally every ~1 hours
            minChange: 50, // Report when value changed by 0.5c
          },
        },
      });
    }

  }


  get illuminanceMeasurementCluster() {
    const illuminanceMeasurementClusterEndpoint = this.getClusterEndpoint(CLUSTER.ILLUMINANCE_MEASUREMENT);
    if (illuminanceMeasurementClusterEndpoint === null) throw new Error('MISSING_OCCUPANCY_SENSING_CLUSTER');
    return this.zclNode.endpoints[illuminanceMeasurementClusterEndpoint].clusters.illuminanceMeasurement;
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log(this.getName() + ' has been added');
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
    this.log(this.getName() + ' settings where changed');
    // OccupancySensing - pirOccupiedToUnoccupiedDelay
    /*
    if (changedKeys.includes('pirOccupiedToUnoccupiedDelay')) {
      const _pirOccupiedToUnoccupiedDelay = newSettings['pirOccupiedToUnoccupiedDelay'];

      this.log('[onSettings]', `Writing attribute pirOccupiedToUnoccupiedDelay → ${_pirOccupiedToUnoccupiedDelay}.`);
      this.occupancySensingCluster.writeAttributes({ pirOccupiedToUnoccupiedDelay: _pirOccupiedToUnoccupiedDelay }).catch(err => {
        this.error('[onSettings]', 'Failed to write attribute pirOccupiedToUnoccupiedDelay.', err);
      });
    }

    // Eva - luxThreshold
    if (changedKeys.includes('luxThreshold')) {
      const _luxThreshold = this.LuxToUInt(newSettings['luxThreshold']);

      this.log('[onSettings]', `Writing attribute luxThreshold → ${_luxThreshold}.`);
      this.illuminanceMeasurementCluster.writeAttributes({ luxThreshold: _luxThreshold }).catch(err => {
        this.error('[onSettings]', 'Failed to write attribute luxThreshold.', err);
      });
    }

     */
  }

  LuxToUInt(value) {
    return Math.round(10000 * Math.log10(value)) + 1;
  }

  UIntToLux(value) {
    return Math.round(10 ** ((value - 1) / 10000));
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('Eva Motion sensor was renamed to ' + name);
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log(this.getName() + ' has been deleted');
  }

}

module.exports = EvaMotionSensor;
