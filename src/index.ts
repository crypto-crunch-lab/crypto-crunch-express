import express, { Request, Response, NextFunction } from 'express';
import routes from "./routes"; import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
const path = require('path');

const swaggerSpec = YAML.load(path.join(__dirname, '../dist/swagger.yaml'))
const app = express();
const prod: boolean = process.env.NODE_ENV === ' production';


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(routes);

interface ErrorType {
  message: string;
  status: number;
}

app.use(function (err: ErrorType, req: Request, res: Response, next: NextFunction) {

  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "production" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app
  .listen(8000, () => {
    console.log(`
    ################################################
          🛡️  Server listening on port 🛡️
    ################################################
  `);
  })
  .on("error", (err) => {
    console.error(err);
    process.exit(1);
  });