var Service, Characteristic;
var exec2 = require("child_process").exec;
var response;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    Accessory = homebridge.hap.Accessory;
    //UUIDGen = homebridge.hap.uuid;
    homebridge.registerAccessory('homebridge-samsung-airpurifier', 'SamsungAirpurifier', SamsungAirpuri);
}

function SamsungAirpuri(log, config) {
    this.log = log;
    this.name = config["name"];
    this.ip = config["ip"];
    this.token = config["token"];
    this.patchCert = config["patchCert"];
    this.accessoryName = config["name"];
    this.setOn = true;
    this.setOff = false;
}

SamsungAirpuri.prototype = {

    execRequest: function(str, body, callback) {
        exec2(str, function(error, stdout, stderr) {
            callback(error, stdout, stderr)
        })
        //return stdout;
    },
    identify: function(callback) {
        this.log("장치 확인됨");
        callback(); // success
    },

    getServices: function() {

        //var uuid;
        //uuid = UUIDGen.generate(this.accessoryName);
        this.airpuriSamsung = new Service.AirPurifier(this.name);

        //전원 설정
        this.airpuriSamsung.getCharacteristic(Characteristic.Active)
            .on('get', this.getActive.bind(this))
            .on('set', this.setActive.bind(this));

        //현재 모드 설정
        this.airpuriSamsung.getCharacteristic(Characteristic.TargetAirPurifierState)
            .on('set', this.setTargetAirPurifierState.bind(this))       
            .on('get', this.getTargetAirPurifierState.bind(this));
   
        //현재 모드 확인
        this.airpuriSamsung.getCharacteristic(Characteristic.CurrentAirPurifierState)
            .on('set', this.setCurrentAirPurifierState.bind(this))       
            .on('get', this.getCurrentAirPurifierState.bind(this));

        var informationService = new Service.AccessoryInformation()
            .setCharacteristic(Characteristic.Manufacturer, 'Samsung')
            .setCharacteristic(Characteristic.Model, 'Air purifier')
            .setCharacteristic(Characteristic.SerialNumber, 'AX40M6581WMD');
            
            
        return [informationService, this.airpuriSamsung];
    },

    //services

    getActive: function(callback) {
        var str;
        var body;
        str = 'curl -s -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure -X GET https://' + this.ip + ':8888/devices|jq \'.Devices[0].Operation.power\'';
        this.log(str);

        this.execRequest(str, body, function(error, stdout, stderr) {
            if (error) {
                callback(error);
            } else {
                this.response = stdout;
                this.response = this.response.substr(1, this.response.length - 3);
            if (this.response == "Off") {
                callback(null, Characteristic.Active.INACTIVE);
                this.log("전원 꺼짐 확인");
            } else if (this.response == "On") {
                this.log("전원 켜짐 확인");
                callback(null, Characteristic.Active.ACTIVE);
            } else
                this.log(this.response + "연결 오류");
            }
        }.bind(this));

    },

    setActive: function(state, callback) {
        var body;
        var token, ip, patchCert;
        token = this.token;
        ip = this.ip;
        patchCert = this.patchCert;
        
        var activeFuncion = function(state) {
            if (state == Characteristic.Active.ACTIVE) {
                str = 'curl -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + token + '" --cert ' + patchCert + ' --insecure -X PUT -d \'{"Operation" : {\"power"\ : \"On"\}}\' https://' + ip + ':8888/devices/0';
                console.log("전원 켜짐 설정");
            } else {
                console.log("전원 꺼짐 설정");
                str = 'curl -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + token + '" --cert ' + patchCert + ' --insecure -X PUT -d \'{"Operation" : {\"power"\ : \"Off"\}}\' https://' + ip + ':8888/devices/0';
            }
        }
        activeFuncion(state);
        this.log(str);

        this.execRequest(str, body, function(error, stdout, stderr) {
            if (error) {
            } else {
                //callback();
                this.log(stdout);
            }
        }.bind(this));
        callback();
    },
    
    getCurrentAirPurifierState: function(callback) {
        var str;
        var body;
        str = 'curl -s -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure -X GET https://' + this.ip + ':8888/devices|jq \'.Devices[0].Operation.power\'';
        this.log(str);

        this.execRequest(str, body, function(error, stdout, stderr) {
            if (error) {
                callback(error);
            } else {
                this.response = stdout;
                this.response = this.response.substr(1, this.response.length - 3);
            if (this.response == "Off") {
                callback(null, Characteristic.CurrentAirPurifierState.INACTIVE);
                this.log("전원 꺼짐 확인");
            } else if (this.response == "On") {
                this.log("전원 켜짐 확인");
                callback(null, Characteristic.CurrentAirPurifierState.PURIFYING_AIR);
            } else
                this.log(this.response + "연결 오류");
            }
        }.bind(this));

    },

    setCurrentAirPurifierState: function(state, callback) {
        var body;
        var token, ip, patchCert;
        token = this.token;
        ip = this.ip;
        patchCert = this.patchCert;
        
        var activeFuncion = function(state) {
            if (state == Characteristic.CurrentAirPurifierState.PURIFYING_AIR) {
                str = 'curl -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + token + '" --cert ' + patchCert + ' --insecure -X PUT -d \'{"Operation" : {\"power"\ : \"On"\}}\' https://' + ip + ':8888/devices/0';
                console.log("전원 켜짐 설정2");
            } else {
                console.log("전원 꺼짐 설정2");
                str = 'curl -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + token + '" --cert ' + patchCert + ' --insecure -X PUT -d \'{"Operation" : {\"power"\ : \"Off"\}}\' https://' + ip + ':8888/devices/0';
            }
        }
        activeFuncion(state);
        this.log(str);

        this.execRequest(str, body, function(error, stdout, stderr) {
            if (error) {
            } else {
                //callback();
                this.log(stdout);
            }
        }.bind(this));
        callback();
    },    


    getTargetAirPurifierState: function(callback) {
        var str;
        var body;
        str = 'curl -s -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure -X GET https://' + this.ip + ':8888/devices|jq \'.Devices[0].Wind.speedLevel\'';
        this.log(str);

        this.execRequest(str, body, function(error, stdout, stderr) {
            if (error) {
                callback(error);
            } else {
                this.response = parseInt(stdout);
            if (this.response == 1 || this.response == 2 || this.response == 3 || this.response == 4) {
                callback(null, Characteristic.TargetAirPurifierState.MANUAL);
                this.log("수동 모드 확인");
            } else if (this.response == 0) {
                this.log("자동 모드 확인");
                callback(null, Characteristic.TargetAirPurifierState.AUTO);
            } else
                this.log(this.response + "연결 오류");
            }
        }.bind(this));

    },

    setTargetAirPurifierState: function(state, callback) {

        switch (state) {

            case Characteristic.TargetAirPurifierState.MANUAL:
                var body;
                this.log("취침모드로 설정");
                str = 'curl -X PUT -d \'{"speedLevel": 1}\' -v -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure https://' + this.ip + ':8888/devices/0/wind';
                this.log(str);
                this.execRequest(str, body, function(error, stdout, stderr) {
                    if (error) {
                        callback(error);
                    } else {
                        callback();
                        this.log(stdout);
                    }
                }.bind(this));
                break;

            case Characteristic.TargetAirPurifierState.AUTO:
                var body;
                this.log("자동모드로 설정");
                str = 'curl -X PUT -d \'{"speedLevel": 0}\' -v -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure https://' + this.ip + ':8888/devices/0/wind';
                this.log(str);
                this.execRequest(str, body, function(error, stdout, stderr) {
                    if (error) {
                        callback(error);
                    } else {
                        callback();
                        this.log(stdout);
                    }
                }.bind(this));
                break;
         }
    }
}
