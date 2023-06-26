'use strict';

const { ZCLNode, CLUSTER, Cluster } = require('zigbee-clusters')
const { ZigBeeDevice } = require('homey-zigbeedriver')
const Homey = require('homey')

class HanAdapterDevice extends ZigBeeDevice {

	async onNodeInit({zclNode}) {
		//Not sure if we have to add the custom capability every time or just once
		//Custom capabilities based on attribute reports
		//Implements the general meter power capability that reads the meter reader and adds default flow cards
		this.registerCapability('meter_power', CLUSTER.METERING, {
			getOpts: {
				getOnStart: true,
			},
			get: "currentSummationDelivered",
			getParser: value => value / 1000,
			report: "currentSummationDelivered",
			reportParser: value => value / 1000,
			reportOps: {
				configureAttributeReporting: {
					minInterval: 60,
					maxInterval: 3600,
					minChange: 0,
					reportableChange: 0,
					cluster: CLUSTER.METERING,
					attributeName: "currentSummationDelivered", 
				}
			}
			
			
		});
		this.addCapability('instantaneous_demand')
		this.addCapability('rms_voltage')
		this.addCapability('rms_current')


	
	

		await this.configureAttributeReporting([
			{
				endpointId: 1,
				cluster: CLUSTER.METERING,
				attributeName: "instantaneousDemand", 
				minInterval: 10,
				maxInterval: 60, 
				minChange: 5,
			},
			{
				endpointId: 1, 
				cluster: CLUSTER.ELECTRICAL_MEASUREMENT,
				attributeName: "rmsVoltage",
				minInterval: 10,
				maxInterval: 60, 
				minChange: 1,
			},
			{
				endpointId: 1, 
				cluster: CLUSTER.ELECTRICAL_MEASUREMENT,
				attributeName: "rmsCurrent",
				minInterval: 10,
				maxInterval: 60, 
				minChange: 0,
			}
		]);

		

		  zclNode.endpoints[1].clusters.metering.on(
			  'attr.instantaneousDemand', 
			  (instantaneousDemand) => {
				//Handle reported attribute value
				//this.log("Current draw: " + instantaneousDemand);
				//Multiplier is 1, divisor is 1000. 
				var meterPower = instantaneousDemand/1000;
				
				this.setCapabilityValue('instantaneous_demand', meterPower).catch(this.error);
		  });

		  zclNode.endpoints[1].clusters[CLUSTER.ELECTRICAL_MEASUREMENT.NAME].on(
			'attr.rmsVoltage', 
			(rmsVoltage) => {
			  //Handle reported attribute value
			  //this.log("Voltage: " + rmsVoltage);
			  //Multiplier is 1, divisor is 10. 
			  var voltage = rmsVoltage/10;
			  this.setCapabilityValue('rms_voltage', voltage).catch(this.error);
		});

		zclNode.endpoints[1].clusters[CLUSTER.ELECTRICAL_MEASUREMENT.NAME].on(
			'attr.rmsCurrent', 
			(rmsCurrent) => {
			  //Handle reported attribute value
			  //this.log("Current: " + rmsCurrent);
			  //Multiplier is 1, divisor is 10. 
			  var current = rmsCurrent/1000;
			  this.setCapabilityValue('rms_current', current).catch(this.error);
		});


		
		
		
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

	}

	

}



module.exports = HanAdapterDevice;
