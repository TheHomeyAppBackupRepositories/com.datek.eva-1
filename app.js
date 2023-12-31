'use strict';

const Homey = require('homey');

// Enable zigbee-cluster logging
const { Util } = require('homey-zigbeedriver');
Util.debugZigbeeClusters(true);

class EvaSmartHome extends Homey.App {
  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('Eva Smart Home has been initialized');
  }



}

module.exports = EvaSmartHome;