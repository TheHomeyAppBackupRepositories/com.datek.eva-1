const Homey = require('homey');
const { CLUSTER, ZCLNode } = require('zigbee-clusters');
const { ZigBeeDevice } = require('homey-zigbeedriver');


class EvaSocketDriver extends Homey.Driver {
  async onInit() {
    super.onInit();
    this.log('EvaSocketDriver has been initialized');


    //Getting flow action card from homeycompose/flow/actions/[id].json
    let all_sockets_onoff_card = this.homey.flow.getActionCard('turn_all');
    all_sockets_onoff_card.registerRunListener(async (args, state) => {
        //Gets the onoff value from the user choice in the Homey app during flow setup
        let onoff_value = args.on_off_flow;
        let boolval = false;
        
        //Sets the onoff signal to true if the user chooses 'on', otherwise if user chooses 'off' defaults to false
        if(onoff_value === 'on'){
            boolval = true;
        } 
        
        //Gets all devices linked to the current driver(this). In this example: Eva Sockets
        const devices = this.getDevices();



        //Loops through all devices and sets cluster capability value of the onoff attribute in the onoff cluster. 
        //!! Cannot simply use setCapabilityValue, because this will not actually impact the zigbee device, but only
        //the display in the homey app 
        for (const device of Object.values(devices)) {
            //Requires importing CLUSTER from 'zigbee-clusters
            await device.setClusterCapabilityValue('onoff', CLUSTER.ON_OFF, boolval)
                .then(() => console.log('\x1b[33m%s\x1b[0m', device.getName() + " turned " + onoff_value))
                .catch(error => console.log(chalk.red(`Error:`, error)));
        }

         return false;

      });


      //Getting flow action card from homeycompose/flow/actions/[id].json
    let random_toggles_card = this.homey.flow.getActionCard('random_toggles');
    random_toggles_card.registerRunListener(async (args, state) => {
        //Gets all devices linked to the current driver(this). In this example: Eva Sockets
        const devices = this.getDevices();

        //Loops through all devices and sets cluster capability value of the onoff attribute in the onoff cluster. 
        //!! Cannot simply use setCapabilityValue, because this will not actually impact the zigbee device, but only
        //the display in the homey app 
        for (const device of Object.values(devices)) {
            let random_int = Math.floor(Math.random() * 2);
            let rand_value = "off";
            let rand_bool = false;

            if(random_int === 1){
                rand_bool = true;
                rand_value = "on";
            }
            //Requires importing CLUSTER from 'zigbee-clusters
            await device.setClusterCapabilityValue('onoff', CLUSTER.ON_OFF, rand_bool)
                .then(() => console.log('\x1b[33m%s\x1b[0m', device.getName() + " turned " + rand_value))
                .catch(error => console.log(chalk.red(`Error:`, error)));
        }

         return false;

      });

      


  }


}



module.exports = EvaSocketDriver;