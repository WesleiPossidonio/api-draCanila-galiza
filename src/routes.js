import { Router } from 'express'
import TokenController from './appp/controllers/TokenController.js'
import SendMail from './appp/controllers/SendMail.js'

const routes = new Router()

routes.post('/tokenFeed', TokenController.store)
routes.get('/feedInsta', TokenController.index)
routes.put('/updateToken/:id', TokenController.update)

routes.post('/sendMail', SendMail.store)

export default routes