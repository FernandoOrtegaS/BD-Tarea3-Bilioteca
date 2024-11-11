import { neon } from '@neondatabase/serverless';
import { engine } from 'express-handlebars';
import express from 'express';
import cookieParser from 'cookie-parser';

const sql = neon('postgresql://neondb_owner:rpxY60mWIvHG@ep-nameless-scene-a5cyx3xc.us-east-2.aws.neon.tech/neondb?sslmode=require');

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use('/images', express.static('images'));
app.use(express.static('public'));

app.get('/', async (req, res) => {
    res.render('index');
});

app.post('/prestamo', async (req, res) => {
    const { id_libro, id_cliente, fecha_solicitud, fecha_devolucion } = req.body;

    try {
       
        const result = await sql`
            INSERT INTO prestamo (id_libro, id_cliente, fecha_solicitud, fecha_devolucion)
            VALUES (${id_libro}, ${id_cliente}, ${fecha_solicitud}, ${fecha_devolucion})
            RETURNING *;
        `;

        const [cliente] = await sql`SELECT nombre FROM cliente WHERE id_cliente = ${id_cliente}`;
        const [libro] = await sql`SELECT titulo FROM libro WHERE id_libro = ${id_libro}`;

        
        res.render('prestamo_exito', {
            cliente: cliente.nombre,
            libro: libro.titulo,
            fecha_solicitud,
            fecha_devolucion
        });
    } catch (err) {
        console.error('Error al realizar el prestamo', err);
        res.status(500).send('Error al realizar el prestamo');
    }
});

app.get('/prestamos_no_devueltos', async (req, res) => {
  try {
      
      const result = await sql`
          SELECT * 
          FROM prestamo 
          WHERE fecha_devolucion IS NULL
      `;

      if (result.length > 0) {
          res.render('prestamos_no_devueltos', { prestamos: result });
      } else {
          res.render('prestamos_no_devueltos', { prestamos: [] });
      }
  } catch (err) {
      console.error('Error al obtener los préstamos no devueltos', err);
      res.status(500).send('Error al obtener los préstamos no devueltos');
  }
});

app.get('/catalogo', async (req, res) => {
  try{
      const result = await sql`
      select l.* , j.cantidad , l.paginas , a.nombre
      from libro l
      join ejemplares j ON l.id_libro = j.id_libro
      Join autor a ON l.id_autor = a.id_autor
      `;
      
      res.render('catalogo', { libros: result });
  }catch(err){
      console.error('Error al obtener el catalogo', err);
      res.status(500).send('Error al obtener el catalogo');
}

});

app.get('/filtro_editorial', (req, res) => {
  res.render('filtro_editorial', { libros: null, editorial: '' });
});

app.post('/filtro_editorial', async (req, res) => {
  const { editorial } = req.body;
  try {
      const result = await sql`
          SELECT l.*, j.cantidad, l.paginas, a.nombre AS autor_nombre, e.nombre AS editorial_nombre
          FROM libro l
          JOIN ejemplares j ON l.id_libro = j.id_libro
          JOIN autor a ON l.id_autor = a.id_autor
          JOIN editorial e ON l.id_editorial = e.id_editorial
          WHERE e.nombre = ${editorial}
      `;

      
      res.render('filtro_editorial', { libros: result, editorial });
  } catch (err) {
      console.error('Error al filtrar libros por editorial', err);
      res.status(500).send('Error al filtrar libros por editorial');
  }
});

app.get('/filtro_autor', (req, res) => {
  res.render('filtro_autor', { libros: null, autor: '' });
});

app.post('/filtro_autor', async (req, res) => {
  const { autor } = req.body;
  try {
      const result = await sql`
          SELECT l.*, j.cantidad, l.paginas, a.nombre AS autor_nombre, e.nombre AS editorial_nombre
          FROM libro l
          JOIN ejemplares j ON l.id_libro = j.id_libro
          JOIN autor a ON l.id_autor = a.id_autor
          JOIN editorial e ON l.id_editorial = e.id_editorial
          WHERE a.nombre = ${autor}
      `;

      
      res.render('filtro_autor', { libros: result, autor });
  } catch (err) {
      console.error('Error al filtrar libros por autor', err);
      res.status(500).send('Error al filtrar libros por autor');
  }
});

app.get('/filtro_nombrelibro', async (req, res) => {
  res.render('filtro_nombrelibro', { libros: null, titulo: '' });
});

app.post('/filtro_nombrelibro', async (req, res) => {
  const { titulo } = req.body;
  try {
      const result = await sql`
          SELECT l.*, j.cantidad, l.paginas, a.nombre AS autor_nombre, e.nombre AS editorial_nombre
          FROM libro l
          JOIN ejemplares j ON l.id_libro = j.id_libro
          JOIN autor a ON l.id_autor = a.id_autor
          JOIN editorial e ON l.id_editorial = e.id_editorial
          WHERE l.titulo = ${titulo}
      `;

      
      res.render('filtro_nombrelibro', { libros: result, titulo });
  } catch (err) {
      console.error('Error al filtrar libros por nombre', err);
      res.status(500).send('Error al filtrar libros por nombre');
  }
});


const port = process.env.PORT || 3028;
app.listen(port, () => console.log(`Servidor corriendo en el puerto ${port}`));



