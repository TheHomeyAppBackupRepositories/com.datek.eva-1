'use strict';

const { ElectricalMeasurementCluster, ZCLDataTypes } = require('zigbee-clusters');

class EvaElectricalMeasurementCluster extends ElectricalMeasurementCluster {

    static get ATTRIBUTES() {
        return {
            ...super.ATTRIBUTES,
            rmsVoltagePhaseB: {
                id: 2309,
                manufacturerId: '0x1337',
                type: ZCLDataTypes.uint16
            },
            rmsCurrentPhaseB: {
                id: 2312,
                manufacturerId: '0x1337',
                type: ZCLDataTypes.uint16 },
            rmsVoltagePhaseC: {
                id: 2565,
                manufacturerId: '0x1337',
                type: ZCLDataTypes.uint16 },
            rmsCurrentPhaseC: {
                id: 2568,
                manufacturerId: '0x1337',
                type: ZCLDataTypes.uint16 },
        };
    }

}

module.exports = EvaElectricalMeasurementCluster;