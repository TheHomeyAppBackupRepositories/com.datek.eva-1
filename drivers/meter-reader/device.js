'use strict';

const { CLUSTER, Cluster } = require('zigbee-clusters')
const { ZigBeeDevice } = require('homey-zigbeedriver')
const EvaElectricalMeasurementCluster = require('../../lib/EvaElectricalMeasurementCluster')
Cluster.addCluster(EvaElectricalMeasurementCluster)
let acCurrentMultiplier = 0
let acCurrentDivisor = 0
let acVoltageMultiplier = 0
let acVoltageDivisor = 0
class HanAdapterDevice extends ZigBeeDevice {

	async onNodeInit({zclNode, node}) {

		this.log('Meter Reader: Node has been initialized')
		this.log(this.getCapabilities())

		const SHOULD_SHOW_VOLTAGE = this.getSettings().toggle_voltage
		const SHOULD_SHOW_CURRENT = this.getSettings().toggle_current
		const SHOULD_SHOW_VOLTAGE_PHASE_B = this.getSettings().toggle_voltage_phase_b
		const SHOULD_SHOW_CURRENT_PHASE_B = this.getSettings().toggle_current_phase_b
		const SHOULD_SHOW_VOLTAGE_PHASE_C = this.getSettings().toggle_voltage_phase_c
		const SHOULD_SHOW_CURRENT_PHASE_C = this.getSettings().toggle_current_phase_c

		if (SHOULD_SHOW_CURRENT_PHASE_B) {
			await this.setupCustomCapability("measure_rms_current_phase_b", "rmsCurrentPhaseB")
		}
		
		if (SHOULD_SHOW_CURRENT_PHASE_C) {
			await this.setupCustomCapability("measure_rms_current_phase_c", "rmsCurrentPhaseC")
		}
		if (SHOULD_SHOW_VOLTAGE_PHASE_B) {
			await this.setupCustomCapability("measure_rms_voltage_phase_b", "rmsVoltagePhaseB")
		}
		
		if (SHOULD_SHOW_VOLTAGE_PHASE_C) {
			await this.setupCustomCapability("measure_rms_voltage_phase_c", "rmsVoltagePhaseC")
		}


		if (SHOULD_SHOW_VOLTAGE) {
			this.registerCapability('measure_rms_voltage', CLUSTER.ELECTRICAL_MEASUREMENT, {
				getOpts: {
					getOnStart: true,
				},
				get: 'rmsVoltage',
				report: 'rmsVoltage',
				reportOpts: {
					configureAttributeReporting: {
						attributeName: 'rmsVoltage',
						minInterval: 60,
						maxInterval: 3600,
						minChange: 0,
					},
				},
			});


			this.zclNode.endpoints[1].clusters.electricalMeasurement.on(
				'attr.rmsVoltage', async value => {
					//Handle reported attribute value
					if (acVoltageMultiplier === 0 || acVoltageDivisor === 0){
						let attributes = await zclNode.endpoints[1].clusters["electricalMeasurement"].readAttributes('acVoltageDivisor', 'acVoltageMultiplier')
						acVoltageMultiplier = attributes.acVoltageMultiplier
						acVoltageDivisor = attributes.acVoltageDivisor
						value = value * acVoltageMultiplier
						value = value / acVoltageDivisor
					} else {
						value = value * acVoltageMultiplier
						value = value / acVoltageDivisor
					}


					this.log("Current voltage: " + value);
					if (value !== null && this.hasCapability("measure_rms_voltage")) {
						this.setCapabilityValue('measure_rms_voltage', value).catch(this.error)
					}
				});


		}

		if (SHOULD_SHOW_CURRENT) {
			this.registerCapability('measure_rms_current', CLUSTER.ELECTRICAL_MEASUREMENT, {
				getOpts: {
					getOnStart: true,
				},
				get: 'rmsCurrent',
				report: 'rmsCurrent',
				reportOpts: {
					configureAttributeReporting: {
						attributeName: 'rmsCurrent',
						minInterval: 60,
						maxInterval: 3600,
						minChange: 0,
					},
				},
			});

			this.zclNode.endpoints[1].clusters.electricalMeasurement.on(
				'attr.rmsCurrent', async value => {
					//Handle reported attribute value
					if (acCurrentMultiplier === 0 || acCurrentDivisor === 0){
						let attributes = await zclNode.endpoints[1].clusters["electricalMeasurement"].readAttributes('acCurrentDivisor', 'acCurrentMultiplier')
						acCurrentMultiplier = attributes.acCurrentMultiplier
						acCurrentDivisor = attributes.acCurrentDivisor
						value = value * acCurrentMultiplier
						value = value / acCurrentDivisor
					} else {
						value = value * acCurrentMultiplier
						value = value / acCurrentDivisor
					}

					this.log("Current current: " + value);
					if (value !== null && this.hasCapability("measure_rms_current")) {
						this.setCapabilityValue('measure_rms_current', value).catch(this.error)
					}
				});
		}
		

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
					minInterval: 10,
					maxInterval: 3600,
					minChange: 0,
					reportableChange: 0,
					cluster: CLUSTER.METERING,
					attributeName: "currentSummationDelivered",
				}
			}
		});
		

		this.registerCapability('measure_temperature', CLUSTER.TEMPERATURE_MEASUREMENT, {
			getOpts: {
				getOnStart: true,
			},
			getParser: value => parseFloat((value/100).toFixed(1)) + this.getSettings().offset,
			reportParser: value => parseFloat((value/100).toFixed(1)) + this.getSettings().offset,
			reportOps: {
				configureAttributeReporting: {
					minInterval: 30,
					maxInterval: 3600,
					minChange: 50,
				}
			}
		});


		this.registerCapability('measure_power', CLUSTER.METERING, {
			getOpts: {
				getOnStart: false,
			},
			getParser: value => (value * this.getSettings().multiplier),
			reportParser: value => (value * this.getSettings().multiplier),
			get: "instantaneousDemand",
			report: "instantaneousDemand",
			reportOps: {
				configureAttributeReporting: {
					minInterval: 10,
					maxInterval: 3600,
					minChange: 0,
					cluster: CLUSTER.METERING,
					attributeName: "instantaneousDemand",
				}
			}
		})


		this.zclNode.endpoints[1].clusters.metering.on(
			'attr.instantaneousDemand', async value => {
				//Handle reported attribute value

				this.log("Current draw: " + value + " W");
				if (value !== null) {
					this.setCapabilityValue('measure_power', value).catch(this.error)
				}

			});


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
		this.log('Meter Reader settings were changed')
		this.log(oldSettings)
		this.log(newSettings)
		this.log(changedKeys)

		let SHOULD_SHOW_VOLTAGE = newSettings.toggle_voltage
		console.log(SHOULD_SHOW_VOLTAGE)
		let SHOULD_SHOW_CURRENT = newSettings.toggle_current
		console.log(SHOULD_SHOW_CURRENT)
		let SHOULD_SHOW_VOLTAGE_PHASE_B = newSettings.toggle_voltage_phase_b
		console.log(SHOULD_SHOW_VOLTAGE_PHASE_B)
		let SHOULD_SHOW_CURRENT_PHASE_B = newSettings.toggle_current_phase_b
		console.log(SHOULD_SHOW_CURRENT_PHASE_B)
		let SHOULD_SHOW_VOLTAGE_PHASE_C = newSettings.toggle_voltage_phase_c
		console.log(SHOULD_SHOW_VOLTAGE_PHASE_C)
		let SHOULD_SHOW_CURRENT_PHASE_C = newSettings.toggle_current_phase_c
		console.log(SHOULD_SHOW_CURRENT_PHASE_C)
		

		if (SHOULD_SHOW_VOLTAGE) {
			if (!this.hasCapability('measure_rms_voltage')) {
				await this.addCapability('measure_rms_voltage').catch(this.error)
			}

			this.registerCapability('measure_rms_voltage', CLUSTER.ELECTRICAL_MEASUREMENT, {
				getOpts: {
					getOnOnline: true,
				},
				get: 'rmsVoltage',
				report: 'rmsVoltage',
				reportOpts: {
					configureAttributeReporting: {
						attributeName: 'rmsVoltage',
						minInterval: 60,
						maxInterval: 3600,
						minChange: 0,
					},
				},
			});


			this.zclNode.endpoints[1].clusters.electricalMeasurement.on(
				'attr.rmsVoltage', async value => {
					//Handle reported attribute value
					if (acVoltageMultiplier === 0 || acVoltageDivisor === 0){
						let attributes = await this.zclNode.endpoints[1].clusters["electricalMeasurement"].readAttributes('acVoltageDivisor', 'acVoltageMultiplier').catch(this.error)
						if (attributes) {
							acVoltageMultiplier = attributes.acVoltageMultiplier
							acVoltageDivisor = attributes.acVoltageDivisor
							value = value * acVoltageMultiplier
							value = value / acVoltageDivisor
						} else {
							this.log("Could not read attributes acVoltageMultiplier and acVoltageDivisor from electricalMeasurement cluster.")
						}
					} else {
						value = value * acVoltageMultiplier
						value = value / acVoltageDivisor
					}
					this.log("Current voltage: " + value + " V");
					if (value !== null) {
						this.setCapabilityValue('measure_rms_voltage', value).catch(this.error)
					}
				});


		} else {
			if (this.hasCapability('measure_rms_voltage')) {
				this.log("Removing capability: measure_rms_voltage")
				await this.removeCapability('measure_rms_voltage').catch(this.error)

			}
		}

		if (SHOULD_SHOW_CURRENT) {
			if (!this.hasCapability('measure_rms_current')) {
				await this.addCapability('measure_rms_current')
			}

			this.registerCapability('measure_rms_current', CLUSTER.ELECTRICAL_MEASUREMENT, {
				getOpts: {
					getOnStart: true,
				},
				get: 'rmsCurrent',
				report: 'rmsCurrent',
				reportOpts: {
					configureAttributeReporting: {
						attributeName: 'rmsCurrent',
						minInterval: 60,
						maxInterval: 3600,
						minChange: 0,
					},
				},
			});

			this.zclNode.endpoints[1].clusters.electricalMeasurement.on(
				'attr.rmsCurrent', async value => {
					//Handle reported attribute value
					this.log("Reported current: " + value + " A");

					if (acCurrentMultiplier === 0 || acCurrentDivisor === 0){
						let attributes = await this.zclNode.endpoints[1].clusters["electricalMeasurement"].readAttributes('acCurrentDivisor', 'acCurrentMultiplier').catch(this.error)
						if (attributes) {
							acCurrentMultiplier = attributes.acCurrentMultiplier
							acCurrentDivisor = attributes.acCurrentDivisor
							value = value * acCurrentMultiplier
							value = value / acCurrentDivisor
						} else {
							this.log("Could not read attributes acCurrentMultiplier and acCurrentDivisor from electricalMeasurement cluster.")
						}
					} else {
						value = value * acCurrentMultiplier
						value = value / acCurrentDivisor
					}
					if (value !== null) {
						this.setCapabilityValue('measure_rms_current', value).catch(this.error)
					}
				});
		} else {
			if (this.hasCapability('measure_rms_current')) {
				this.log("Removing capability: measure_rms_current")
				await this.removeCapability('measure_rms_current').catch(this.error)
			}
		}
		
		if (SHOULD_SHOW_VOLTAGE_PHASE_B) {
			await this.setupCustomCapability("measure_rms_voltage_phase_b", "rmsVoltagePhaseB").catch(this.error)
		} else {
			if (this.hasCapability('measure_rms_voltage_phase_b')) {
				this.log("Removing capability: measure_rms_voltage_phase_b")
				await this.removeCapability('measure_rms_voltage_phase_b').catch(this.error)
			}
		}	
		
		if (SHOULD_SHOW_VOLTAGE_PHASE_C) {
			await this.setupCustomCapability("measure_rms_voltage_phase_c", "rmsVoltagePhaseC").catch(this.error)
		} else {
			if (this.hasCapability('measure_rms_voltage_phase_c')) {
				this.log("Removing capability: measure_rms_voltage_phase_c")
				await this.removeCapability('measure_rms_voltage_phase_c').catch(this.error)
			}
		}
		
		if (SHOULD_SHOW_CURRENT_PHASE_B) {
			await this.setupCustomCapability("measure_rms_current_phase_b", "rmsCurrentPhaseB").catch(this.error)
		} else {
			if (this.hasCapability('measure_rms_current_phase_b')) {
				this.log("Removing capability: measure_rms_current_phase_b")
				await this.removeCapability('measure_rms_current_phase_b').catch(this.error)
			}
		}	
		
		if (SHOULD_SHOW_CURRENT_PHASE_C) {
			await this.setupCustomCapability("measure_rms_current_phase_c", "rmsCurrentPhaseC").catch(this.error)
		} else {
			if (this.hasCapability('measure_rms_current_phase_c')) {
				this.log("Removing capability: measure_rms_current_phase_c")
				await this.removeCapability('measure_rms_current_phase_c').catch(this.error)
			}
		}

	}

	async setupCustomCapability(capabilityId, attributeId) {
		if (!this.hasCapability(capabilityId)) {
			await this.addCapability(capabilityId).catch(this.error)
		}

		let rmsCurrentPhaseBConfiguration = {
			rmsCurrentPhaseB: {
				minInterval: 60,
				maxInterval: 3600,
				minChange: 0
			}
		}
		
		let rmsCurrentPhaseCConfiguration = {
			rmsCurrentPhaseC: {
				minInterval: 60,
				maxInterval: 3600,
				minChange: 0
			}
		}
		
		let rmsVoltagePhaseBConfiguration = {
			rmsVoltagePhaseB: {
				minInterval: 60,
				maxInterval: 3600,
				minChange: 0
			}
		}
		
		let rmsVoltagePhaseCConfiguration = {
			rmsVoltagePhaseC: {
				minInterval: 60,
				maxInterval: 3600,
				minChange: 0
			}
		}
		
		let currentConfiguration
		
		if (attributeId === "rmsVoltagePhaseB") {
			currentConfiguration = rmsVoltagePhaseBConfiguration
		}
		
		if (attributeId === "rmsVoltagePhaseC") {
			currentConfiguration = rmsVoltagePhaseCConfiguration
		}
		if (attributeId === "rmsCurrentPhaseB") {
			currentConfiguration = rmsCurrentPhaseBConfiguration
		}
		
		if (attributeId === "rmsCurrentPhaseC") {
			currentConfiguration = rmsCurrentPhaseCConfiguration
		}
		
		await this.zclNode.endpoints[1].clusters['electricalMeasurement'].configureReporting(currentConfiguration).catch(this.error);

		await this.zclNode.endpoints[1].clusters.electricalMeasurement.on(
			`attr.${attributeId}`, async value => {
				//Handle reported attribute value
				if (attributeId === 'rmsCurrentPhaseB' || attributeId === 'rmsCurrentPhaseC') {
					if (acCurrentMultiplier === 0 || acCurrentDivisor === 0){
						let attributes = await this.zclNode.endpoints[1].clusters["electricalMeasurement"].readAttributes('acCurrentDivisor', 'acCurrentMultiplier').catch(this.error)
						if (attributes) {
							acCurrentMultiplier = attributes.acCurrentMultiplier
							acCurrentDivisor = attributes.acCurrentDivisor
							value = value * acCurrentMultiplier
							value = value / acCurrentDivisor
						} else {
							this.log("Could not read attributes acCurrentMultiplier and acCurrentDivisor from electricalMeasurement cluster.")
						}
					} else {
						value = value * acCurrentMultiplier
						value = value / acCurrentDivisor
					}
				} else if (attributeId === 'rmsVoltagePhaseB' || attributeId === 'rmsVoltagePhaseC') {
					if (acVoltageMultiplier === 0 || acVoltageDivisor === 0){
						let attributes = await this.zclNode.endpoints[1].clusters["electricalMeasurement"].readAttributes('acVoltageDivisor', 'acVoltageMultiplier').catch(this.error)
						if (attributes) {
							acVoltageMultiplier = attributes.acVoltageMultiplier
							acVoltageDivisor = attributes.acVoltageDivisor
							value = value * acVoltageMultiplier
							value = value / acVoltageDivisor
						} else {
							this.log("Could not read attributes acVoltageMultiplier and acVoltageDivisor from electricalMeasurement cluster.")
						}
					} else {
						value = value * acVoltageMultiplier
						value = value / acVoltageDivisor
					}
				}

				this.log(`${attributeId}: ` + value);
				if (value !== null && this.hasCapability(capabilityId)) {
					this.setCapabilityValue(capabilityId, value).catch(this.error)
				}
			});
	}

}



module.exports = HanAdapterDevice;
