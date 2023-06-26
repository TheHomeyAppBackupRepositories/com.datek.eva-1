'use strict';

const { CLUSTER, debug } = require('zigbee-clusters');
const { ZigBeeDevice } = require('homey-zigbeedriver');
debug(true)


class EvaSocket extends ZigBeeDevice {	

	async onNodeInit({zclNode}) {
		this.log("Eva Smart Plug has been initiated.");

		this.registerCapability('onoff', CLUSTER.ON_OFF, {
			getOpts: {
				getOnStart: true
			},
			reportOpts: {
				configureAttributeReporting: {
					minInterval: 1,
					maxInterval: 65534,
					minChange: 0,
				},
			},
		});


		this.registerCapability('measure_power', CLUSTER.ELECTRICAL_MEASUREMENT, {
			getOpts: {
				getOnStart: true,
			},
			reportOpts: {
				configureAttributeReporting: {
					minInterval: 10,
					maxInterval: 300,
					minChange: 0,
				},
			},
		});


		await this.configureAttributeReporting([
			{
				endpointId: 1,
				cluster: CLUSTER.ELECTRICAL_MEASUREMENT,
				attributeName: "activePower",
				minInterval: 10,
				maxInterval: 300,
				minChange: 0,
			},
		]);



	}

	async onSettings({ oldSettings, newSettings, changedKeys }) {
		this.log('Smart plug settings were changed')
		this.log(oldSettings)
		this.log(newSettings)
		this.log(changedKeys)

	}

}

module.exports = EvaSocket;
