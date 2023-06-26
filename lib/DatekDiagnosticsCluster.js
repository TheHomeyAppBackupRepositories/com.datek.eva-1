'use strict';

const { Cluster, ZCLDataTypes } = require('zigbee-clusters');

const ATTRIBUTES = {
    lastResetInfo: {
        id: 0,
        type: ZCLDataTypes.uint8,
        manufacturerId: '0x1337'
    },
    lastExtendedResetInfo: {
        id: 1,
        type: ZCLDataTypes.uint16,
        manufacturerId: '0x1337'
    },
    rebootCounter: {
        id: 2,
        type: ZCLDataTypes.uint16,
        manufacturerId: '0x1337'
    },
    lastHopIqi: {
        id: 3,
        type: ZCLDataTypes.int8,
        manufacturerId: '0x1337'
    },
    lastHopRssi: {
        id: 4,
        type: ZCLDataTypes.sint8,
        manufacturerId: '0x1337'
    },
    txPower: {
        id: 5,
        type: ZCLDataTypes.sint8,
        manufacturerId: '0x1337'
    },
    parentNodeId: {
        id: 6,
        type: ZCLDataTypes.uint16,
        manufacturerId: '0x1337'
    },
    button0ClickCounter: {
        id: 16,
        type: ZCLDataTypes.uint16,
        manufacturerId: '0x1337'
    },
    button0msClickDuration: {
        id: 32,
        type: ZCLDataTypes.uint16,
        manufacturerId: '0x1337'
    },
    debugInt: {
        id: 1025,
        type: ZCLDataTypes.uint32,
        manufacturerId: '0x1337'
    },
    clusterRevision: {
        id: 65533,
        type: ZCLDataTypes.uint16,
        manufacturerId: '0x1337'
    },
};

const COMMANDS = {
}

class DatekDiagnosticsCluster extends Cluster {

    static get ID() {
        return 65261; // 0xFEED
    }

    static get NAME() {
        return 'datekDiagnosticsCluster';
    }

    static get ATTRIBUTES() {
        return ATTRIBUTES;
    }

    static get COMMANDS() {
        return COMMANDS;
    }

}

Cluster.addCluster(DatekDiagnosticsCluster);

module.exports = DatekDiagnosticsCluster;
