import * as express from 'express';
import { Request, Response } from 'express';

const app = express();
const prod : boolean = process.env.NODE_ENV === ' production';

app.set('port', prod ? process.env.PORT : 3000);
app.get('/', (req:Request, res:Response) => {
	res.send('Hello CryptoCrunch')
})

app.listen(app.get('port'), () => {
	console.log(`server is running on ${app.get('port')}`)
})