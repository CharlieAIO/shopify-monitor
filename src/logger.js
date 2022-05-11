const colors = require('colors')

class Logging {

    constructor(id){
        this.id = id
    }

    getTime = () => {
        let t = new Date();
        let hrs = String(t.getHours()).padStart(2, "0");
        let mins = String(t.getMinutes()).padStart(2, "0");
        let secs = String(t.getSeconds()).padStart(2, "0");
        let ms =   String(t.getMilliseconds()).padStart(3, "0");
        return `[${hrs}:${mins}:${secs}.${ms}]`
    }

    taskFormat = () => {
        if(!this.id) {
            return ``
        }
        return `[Task ${String(this.id).padStart(4, '0')}]`
    }

    log = (msg) => {
        console.log(
            colors.white(`${this.getTime()}${this.taskFormat()} ${msg}`)
        )
    }

    success = (msg) => {
        console.log(
            colors.green(`${this.getTime()}${this.taskFormat()} ${msg}`)
        )
    }

    failed = (msg) => {
        console.log(
            colors.red(`${this.getTime()}${this.taskFormat()} ${msg}`)
        )
    }

    warning = (msg) => {
        console.log(
            colors.yellow(`${this.getTime()}${this.taskFormat()} ${msg}`)
        )
    }

    cyan = (msg) => {
        console.log(
            colors.cyan(`${this.getTime()}${this.taskFormat()} ${msg}`)
        )
    }

}


module.exports = {
    Logging
}