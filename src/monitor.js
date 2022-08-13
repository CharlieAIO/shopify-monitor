const { Webhook, MessageBuilder } = require('discord-webhook-node');
const { default: axios } = require('axios').default;
const { Logging } = require('./logger')
const fs = require('fs')

class Shopify {

    constructor(base) {
        this.hook = new Webhook('https://discord.com/api/webhooks/945357394723094578/a-6MTmDDrXCUjmf6rFNKk2SuVcrDG-B7XYJNur3memQnDAfhpWAHmJdR2Zr9lMOiuvcv');
        this.products = []
        this.baseURL = base

        this.failedReq = false;
        this.run = true
        this.logger = new Logging();

        // this.desired = [
        //     'XXS','XS'
        // ]
    }

    getProducts = async () => {
        let f = fs.readFileSync('./products.json', 'utf-8')
        return JSON.parse(f)
    }

    updateProducts = async (data) => {
        fs.writeFileSync('./products.json', JSON.stringify(data))
        return
    }


    start = async () => {
        await this.retrieveData()

        let main = setInterval(async () => {
            this.products = await this.getProducts()

            if (!this.run) clearInterval(main)

            let data = await this.retrieveData()
            if (!this.failedReq) {
                await this.parseResponse(data)
                await this.updateProducts(this.products)

                await this.checkAvailable()
            }

        }, 3500);
    }

    sendMonitoringWebhook = async (index) => {
        try {
            const embed = new MessageBuilder()
                .setTitle('Now Monitoring')
                .addField('Product', `[${this.products[index].name}](${this.products[index].link})`, true)
                .addField('Price', this.products[index].price, false)
                .setThumbnail(this.products[index].image)
                .setColor('#6287F1')
                .setFooter('Shopify Monitor')
                .setTimestamp();

            this.hook.send(embed);
        } catch { this.logger.failed('Failed to send webhook') }
    }

    sendRestockWebhook = async (index) => {
        try {
            const embed = new MessageBuilder()
                .setTitle('Restock Alert')
                .addField('Product', `[${this.products[index].name}](${this.products[index].link})`, true)
                .addField('Price', this.products[index].price, false)
                .setThumbnail(this.products[index].image)
                .setColor('#62F16A')
                .setFooter('Shopify Monitor')
                .setTimestamp();

            this.hook.send(embed);
        } catch { this.logger.failed('Failed to send webhook') }
    }

    retrieveData = async () => {

        let response;
        try {
            response = await axios({
                url: this.baseURL + '/products.json',
                method: 'GET',
                headers: {
                    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
                }
            })
        } catch (e) { this.failedReq = true }


        if (response.status === 200) {
            this.logger.cyan(`checking for restocks...`)
            this.failedReq = false;

            let d = null
            try {
                d = JSON.parse(JSON.stringify(response.data))
            } catch (e) {
                this.failedReq = true
            }
            return d

        }
        else {
            this.failedReq = true
            return null
        }

    }

    parseResponse = async (dataInput) => {
        let products = dataInput.products
        for (var i = 0; i < products.length; i++) {
            let p = products[i]
            let variant = p.variants[0]
            let image = p.images[0].src
            let exists = !(this.products.findIndex(e => e.name === p.title) === -1)

            if (!exists) {
                this.logger.warning(`Now Monitoring: ${p.title}`)
                this.products.push({
                    name: p.title,
                    link: `${this.baseURL}/products/${p.handle}`,
                    inStock: variant.available,
                    price: variant.price,
                    image: image,
                    webhookSent: false
                })
                await this.sendMonitoringWebhook(i)
            } else {
                if (this.products[i].webhookSent && !(variant.available)) {
                    this.products[i].webhookSent = false
                }

                this.products[i] = {
                    name: p.title,
                    link: `${this.baseURL}/products/${p.handle}`,
                    inStock: variant.available,
                    price: variant.price,
                    image: image,
                    webhookSent: this.products[i].webhookSent
                }
            }


        }

    }

    checkAvailable = async () => {
        return new Promise(async (resolve) => {
            let prods = this.products
            for (let x = 0; x < prods.length; x++) {
                //this.desired.includes(prods[x].size)
                if (prods[x].inStock && !prods[x].webhookSent) {
                    this.logger.success(`Restock Alert: ${prods[x].name}`)
                    this.products[x].webhookSent = true
                    await this.sendRestockWebhook(x)
                }

            }
            resolve()
        })
    }


}

let m = new Shopify('https://drinkprime.uk')
m.start()