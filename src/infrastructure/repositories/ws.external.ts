import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
import { image as imageQr } from "qr-image";
import LeadExternal from "../../domain/lead-external.repository";
import axios from 'axios';
import process from 'process'

/**
 * Extendemos los super poderes de whatsapp-web
 */
class WsTransporter extends Client implements LeadExternal {

  public url = 'http://www.limpiezamexico.mx/ApiRest/APIPaginaIndustrial/v1/paginaIndustrial/sp_WhatsAppBot'; //url de api para consultar informacion del usuario
  private status = false;
  arrayTelefonos: any = []
  arrayUsuarios: any = {}; // Array que contiene todos los usuarios que enteractuan con el bot y la api 
  private EM: any; //Metodo encargado de escuchar todos los mensajes que recibe el bot


  constructor() {
    /**
     * executablePath: Necesario para el envio de videos 
     */
    super({
      authStrategy: new LocalAuth(),
      puppeteer: { headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'}
      //puppeteer: { headless: true, args: ['--no-sandbox']},
    });

    //Funcion para que no se interrupta la ejecucion en el servidor heroku
    setInterval(function () { 
      axios.get("https://bot-eco-industrial.herokuapp.com/").catch(function (error) {
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
      console.log('Escanea el codigo QR que esta en la carepta tmp')
      this.generateImage(qr)
    });
  }

  /**
   * Enviar mensaje de WS
   * @param mensaje a enviar y telefono del usuario
   * @returns
   */
  async sendMsg(lead: { message: string; phone: any }): Promise<any> {
    console.log(lead)
    try {

      if (!this.status) return Promise.resolve({ error: "WAIT_LOGIN" });
      const { message, phone } = lead;
      //console.log(phone)
      this.arrayTelefonos = phone

      this.arrayTelefonos.forEach(async (element: any) => {
        let data = {
          "strAccion": "checkingInfo",
          "strTelefono": element
        }
        axios.post(this.url, data).then(async (response: any) => {
          console.log(response.data)
          /*
          let media = await MessageMedia.fromFilePath(`${process.cwd()}/src/assets/video360.mp4`);//`${process.cwd()}/tmp/es5/src/test/webpack`
          this.sendMessage(`${element}@c.us`, media, { caption: '*Equipo Ecodeli Industrial* \n \n Por este medio te haremos llegar una evaluación que nos permitirá ayudarte a mejorar el ambiente laboral dentro de nuestra empresa. \n \n *1.- 📋 Registra este número* \n *2.- En el transcurso de la mañana se enviara una liga donde podrás dar clic y comenzar la evaluacion* \n\nAyúdanos a contestar con toda sinceridad, tus resultados son confidenciales.\n\n *Muchas Gracias y Excelente dia!!*' });
          */

          //console.log(mensaje)
          //this.sendMessage(`${element}@c.us`, mensaje );
          //let mensaje = message.concat(element)
          this.sendMessage(`${element}@c.us`, "*Evaluacion 360°*\n *¡HOLA " + response.data[0].strNombre + "!* \n \n  Para nosotros es importante que contestes estas breves encuestas.\n Te compartimos este enlace donde podras accesar, es unico y exclusivo por persona,\n\n **FAVOR DE NO COMPARTIRLO**. \n \n Enlace: \n https://ecodeli-industrial.com/Evaluacion360/listado/" + element)
        })
        console.log('element', element)
      })

      this.arrayTelefonos = []

    } catch (e: any) {
      return Promise.resolve({ error: e.message });
    }
  }

  getStatus(): boolean {
    return this.status;
  }
  /**
   * 
   * @param base64 Metodo que genera el codigo qr que lee el telefono donde se van a responder todos los mensajes
   */
  private generateImage = (base64: string) => {
    const path = `${process.cwd()}/tmp`;
    let qr_svg = imageQr(base64, { type: "svg", margin: 4 });
    qr_svg.pipe(require("fs").createWriteStream(`${path}/qr.svg`));
    console.log(`⚡ Recuerda que el QR se actualiza cada minuto ⚡'`);
    console.log(`⚡ Actualiza F5 el navegador para mantener el mejor QR⚡`);
  };
}
export default WsTransporter;
