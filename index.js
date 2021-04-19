
import axios from 'axios'
import { SMSAPI } from './PRIVATE_KEY'

const server_list = [

    {
        name: "localtest",
        address: "http://localhost:3000",
        options: {
            method: "GET"
        }

    },
    {
        name: "google",
        address: "http://google.com"
    }
]

let failedServices = []
const healthcheckRoute = `/`
const checkServerHealthInterval = 10000


const sendSMS = (message) => {
    SMSAPI.Send({ message, sender: "1000596446", receptor: "09394339162" }, function (response, status) {

        console.log(`\x1b[33m 
            ******** SMS RESPONSE :  \n
            messageid:${response[0].messageid} \n
            date:${Date(response[0])} \n
            receptor:${response[0].receptor} \n
            Sending Status:${response[0].statustext}
             \x1b[0m`);
        console.log(`\x1b[33m SMS STATUS :${status} ****** \x1b[0m`);

    })

}

setInterval(() => {
    console.log(failedServices);

    server_list.map((server, index) => {
        const isServerFailedBeforeIndex = failedServices.findIndex(element => element.name === server.name)

        const request_started_at = Date.now()
        axios.request(`${server.address}${healthcheckRoute}`, server.options || { method: "GET" })
            .then(res => {
                const delay_in_seconds = Date.now() - request_started_at

                const color = delay_in_seconds < 200 ? "\x1b[32m"
                    : delay_in_seconds > 200 && delay_in_seconds < 500 ? "\x1b[33m"
                        : delay_in_seconds > 500 ? "\x1b[35m"
                            : "\x1b[41m"


                if (failedServices[isServerFailedBeforeIndex]?.criticalMode || failedServices[isServerFailedBeforeIndex]?.failedCounter > 0) {

                    sendSMS(`سرویس ${server.name} دوباره به فعالیت خود بازگشت `)

                    failedServices[isServerFailedBeforeIndex] = {
                        ...failedServices[isServerFailedBeforeIndex],
                        criticalMode: false,
                        failedCounter: 0
                    }
                    console.log(`\x1b[36m CLEARED SERVER ${server.name} STATUS  \x1b[0m`);
                }


                console.log("SERVER RESPONSE LOG :" + `\x1b[36m${res.status}\x1b[0m ` + " time consumed : " + `${color}${delay_in_seconds}` + "ms \x1b[0m");


            })
            .catch(err => {

                console.log(`${server.name} SERVER ERROR LOG :` + `\x1b[31m${err}\x1b[0m`);


                if (isServerFailedBeforeIndex >= 0) {
                    if (failedServices[isServerFailedBeforeIndex].failedCounter < 11) {

                        failedServices[isServerFailedBeforeIndex] = {
                            ...failedServices[isServerFailedBeforeIndex],
                            failedCounter: failedServices[isServerFailedBeforeIndex].failedCounter + 1
                        }
                    } else if (failedServices[isServerFailedBeforeIndex].failedCounter > 10 && !failedServices[isServerFailedBeforeIndex].criticalMode) {

                        sendSMS(`سرویس ${failedServices[isServerFailedBeforeIndex].name} با مشکل روبرو گردیده است`)

                        failedServices[isServerFailedBeforeIndex] = {
                            ...failedServices[isServerFailedBeforeIndex],
                            criticalMode: true,
                            failedCounter: 0
                        }
                    }

                } else {
                    failedServices.push({
                        name: server.name,
                        failedCounter: 1

                    })
                }
            })

    })
}, checkServerHealthInterval);