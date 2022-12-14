"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const whatsapp_web_js_1 = require("whatsapp-web.js");
const qr_image_1 = require("qr-image");
const axios_1 = __importDefault(require("axios"));
const process_1 = __importDefault(require("process"));
/**
 * Extendemos los super poderes de whatsapp-web
 */
class WsTransporter extends whatsapp_web_js_1.Client {
    constructor() {
        /**
         * executablePath: Necesario para el envio de videos
         */
        super({
            authStrategy: new whatsapp_web_js_1.LocalAuth(),
            puppeteer: { headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' }
            //puppeteer: { headless: true, args: ['--no-sandbox']},
        });
        this.url = 'http://www.limpiezamexico.mx/ApiRest/APIPaginaIndustrial/v1/paginaIndustrial/sp_WhatsAppBot'; //url de api para consultar informacion del usuario
        this.status = false;
        this.arrayTelefonos = [];
        this.arrayUsuarios = {}; // Array que contiene todos los usuarios que enteractuan con el bot y la api 
        /**
         *
         * @param base64 Metodo que genera el codigo qr que lee el telefono donde se van a responder todos los mensajes
         */
        this.generateImage = (base64) => {
            const path = `${process_1.default.cwd()}/tmp`;
            let qr_svg = (0, qr_image_1.image)(base64, { type: "svg", margin: 4 });
            qr_svg.pipe(require("fs").createWriteStream(`${path}/qr.svg`));
            console.log(`⚡ Recuerda que el QR se actualiza cada minuto ⚡'`);
            console.log(`⚡ Actualiza F5 el navegador para mantener el mejor QR⚡`);
        };
        //Funcion para que no se interrupta la ejecucion en el servidor heroku
        setInterval(function () {
            axios_1.default.get("https://bot-eco-industrial.herokuapp.com/").catch(function (error) {
                console.log(error);
            });
        }, 1500000); // cada 25 minutos (1500000)
        console.log("Iniciando....");
        this.initialize();
        this.on("ready", () => {
            this.status = true;
            //this.EM();
            console.log("LOGIN_SUCCESS");
        });
        this.on("auth_failure", () => {
            this.status = false;
            console.log("LOGIN_FAIL");
        });
        this.on("qr", (qr) => {
            console.log('Escanea el codigo QR que esta en la carepta tmp');
            this.generateImage(qr);
        });
    }
    /**
     *
     * @param lat1 coordenada de centro de costos
     * @param lon1 coordenada de ubicacion del usuario
     * @param lat2 coordenada de centro de costos
     * @param lon2 coordenada de ubicacion del usuario
     * @returns distancia en metros entre las coordenadas del centro de costos y la ubicacion actual del usuario
     */
    getDistanciaMetros(lat1, lon1, lat2, lon2) {
        let rad = function (x) { return x * Math.PI / 180; };
        var R = 6378.137; //Radio de la tierra en km 
        var dLat = rad(lat2 - lat1);
        var dLong = rad(lon2 - lon1);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad(lat1)) *
            Math.cos(rad(lat2)) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        //aquí obtienes la distancia en metros por la conversion 1Km =1000m
        var d = R * c * 1000;
        return d;
    }
    /**
     * Enviar mensaje de WS
     * @param mensaje a enviar y telefono del usuario
     * @returns
     */
    sendMsg(lead) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(lead);
            try {
                if (!this.status)
                    return Promise.resolve({ error: "WAIT_LOGIN" });
                const { message, phone } = lead;
                //console.log(phone)
                this.arrayTelefonos = phone;
                this.arrayTelefonos.forEach((element) => __awaiter(this, void 0, void 0, function* () {
                    let data = {
                        "strAccion": "checkingInfo",
                        "strTelefono": element
                    };
                    axios_1.default.post(this.url, data).then((response) => __awaiter(this, void 0, void 0, function* () {
                        console.log(response.data);
                        /*
                        let media = await MessageMedia.fromFilePath(`${process.cwd()}/src/assets/video360.mp4`);//`${process.cwd()}/tmp/es5/src/test/webpack`
                        this.sendMessage(`${element}@c.us`, media, { caption: '*Equipo Ecodeli Industrial* \n \n Por este medio te haremos llegar una evaluación que nos permitirá ayudarte a mejorar el ambiente laboral dentro de nuestra empresa. \n \n *1.- 📋 Registra este número* \n *2.- En el transcurso de la mañana se enviara una liga donde podrás dar clic y comenzar la evaluacion* \n\nAyúdanos a contestar con toda sinceridad, tus resultados son confidenciales.\n\n *Muchas Gracias y Excelente dia!!*' });
                        */
                        //console.log(mensaje)
                        //this.sendMessage(`${element}@c.us`, mensaje );
                        //let mensaje = message.concat(element)
                        this.sendMessage(`${element}@c.us`, "*Evaluacion 360°*\n *¡HOLA " + response.data[0].strNombre + "!* \n \n  Para nosotros es importante que contestes estas breves encuestas.\n Te compartimos este enlace donde podras accesar, es unico y exclusivo por persona,\n\n **FAVOR DE NO COMPARTIRLO**. \n \n Enlace: \n https://ecodeli-industrial.com/Evaluacion360/listado/" + element);
                    }));
                    console.log('element', element);
                }));
                this.arrayTelefonos = [];
            }
            catch (e) {
                return Promise.resolve({ error: e.message });
            }
        });
    }
    getStatus() {
        return this.status;
    }
}
exports.default = WsTransporter;
