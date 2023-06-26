'use strict';

const { ZCLNode, CLUSTER } = require('zigbee-clusters');
const { ZigBeeDevice } = require('homey-zigbeedriver');



class EvaSocket extends ZigBeeDevice {	

	onNodeInit({zclNode}) {
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
					maxInterval: 0,
					minChange: 0,
				},
			},
		});


	}

}

module.exports = EvaSocket;
