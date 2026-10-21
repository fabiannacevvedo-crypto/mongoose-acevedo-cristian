# Práctica de MongoDB y Mongoose

**Estudiante:** Cristian Acevedo  
**Institución:** Instituto Politécnico Formosa  
**Materia:** Desarrollo Web Backend / Unidad 3 (2do Cuatrimestre)  
**Repositorio:** `mongoose-acevedo-cristian`

---

## 📋 Descripción del Proyecto

Este proyecto implementa una API REST modularizada en Node.js y Express utilizando Mongoose como ODM para interactuar con una base de datos MongoDB. Cumple estrictamente con los criterios de evaluación solicitados:
- Uso de **ESModules** (`import`/`export`).
- Separación limpia en capas: `config`, `models`, `routes`, `controllers`, `middlewares`.
- Validación de datos exhaustiva mediante **express-validator**, middleware reutilizable de errores (código 400) y uso de `matchedData()` en controladores.
- Modelado de esquemas con:
  - 1 **Propiedad embebida** (`address` dentro de `User`).
  - 1 **Relación 1:1** referenciada (`User` <-> `Profile`).
  - 1 **Relación 1:N** referenciada (`User` instructor <-> `Course`).
  - 1 **Relación N:M** referenciada (`Course` <-> `Tag`).
- Consultas optimizadas con `.populate()` y demostración de **Virtual Populate** para colecciones sin referencia directa.
- CRUD completo con **eliminación lógica** (`isDeleted`, `deletedAt`) y **eliminación en cascada**.
- Flujo estricto de ramas en Git: `main`, `develop` y desarrollo en `mongoose-basico` con merges limpios.

---

## 🛠️ Tecnologías Utilizadas

- **Node.js** (v24+)
- **Express.js** (v4.21+)
- **Mongoose** (v8.9+)
- **express-validator** (v7.2+)
- **dotenv**, **cors**, **cookie-parser**
- **MongoDB** (v8.3+)

---

## 🗂️ Estructura del Proyecto

```text
mongoose-acevedo-cristian/
├── src/
│   ├── config/
│   │   └── database.js              # Conexión a MongoDB con Mongoose
│   ├── controllers/
│   │   ├── user.controller.js       # CRUD de usuarios y cascada
│   │   ├── profile.controller.js    # CRUD de perfiles (1:1)
│   │   ├── course.controller.js     # CRUD de cursos y vínculo N:M
│   │   └── tag.controller.js        # CRUD de etiquetas y Virtual Populate
│   ├── middlewares/
│   │   ├── validator.middleware.js  # Middleware reutilizable validationResult y paramId
│   │   ├── user.validator.js        # Validaciones de usuario y propiedad embebida
│   │   ├── profile.validator.js     # Validaciones de perfil y regla 1:1 única
│   │   ├── course.validator.js      # Validaciones de curso y validación vínculo N:M
│   │   └── tag.validator.js         # Validaciones de etiquetas
│   ├── models/
│   │   ├── user.model.js            # Modelo User con dirección embebida
│   │   ├── profile.model.js         # Modelo Profile (1:1 referenciado)
│   │   ├── course.model.js          # Modelo Course (1:N y N:M)
│   │   ├── tag.model.js             # Modelo Tag con Virtual Populate hacia Course
│   │   └── index.js                 # Exportación unificada de modelos
│   └── routes/
│       ├── user.routes.js           # Rutas para /api/users
│       ├── profile.routes.js        # Rutas para /api/profiles
│       ├── course.routes.js         # Rutas para /api/courses y N:M
│       ├── tag.routes.js            # Rutas para /api/tags
│       └── index.js                 # Enrutador principal de la API
├── .env.example                     # Variables de entorno de ejemplo
├── .gitignore                       # Archivos ignorados (node_modules, .env)
├── app.js                           # Punto de entrada y configuración de Express
├── package.json                     # Metadatos, dependencias y scripts
├── README.md                        # Documentación principal e investigación
├── EXPLICACION_LOGICA.md            # Documento complementario explicando la lógica del sistema
└── test-e2e.js                      # Suite de pruebas automatizadas end-to-end
```

---

## 🎯 Justificación: Documentos Embebidos vs. Referenciados

### 1. Propiedad Embebida: Dirección (`address` dentro de `User`)
- **Decisión:** Se modeló `address` (`street`, `city`, `country`, `postalCode`) como un subdocumento embebido en `User`.
- **Justificación:**
  - **Cohesión y pertenencia:** La dirección no tiene sentido como una entidad independiente; pertenece de forma exclusiva a ese usuario.
  - **Rendimiento:** Cada vez que se consulta la información de un usuario se requiere su dirección en la misma consulta, evitando consultas adicionales (joins) en la base de datos.
  - **Atomicidad:** Al actualizar el usuario o su dirección, la operación es atómica en una sola escritura sobre el mismo documento.
  - **Tamaño acotado:** Es una estructura pequeña y finita, por lo que no existe riesgo de sobrepasar el límite de 16MB de BSON.

### 2. Relación 1:1: Usuario y Perfil (`User` <-> `Profile`)
- **Decisión:** Se implementó mediante referencias (`user: ObjectId` único en `Profile`, y `profile: ObjectId` en `User`).
- **Justificación:**
  - **Separación de responsabilidades:** La colección `User` almacena credenciales y datos principales del sistema, mientras que `Profile` maneja datos extendidos (biografía, redes sociales, teléfono).
  - **Evitar documentos sobredimensionados:** Permite que las consultas masivas a usuarios sean ultralivianas sin cargar campos de texto largo de biografía.
  - **Control de unicidad:** Se define `unique: true` a nivel de índice de Mongoose/MongoDB y validación en `express-validator` para asegurar que ningún usuario posea más de un perfil.

### 3. Relación 1:N: Instructor y Cursos (`User` <-> `Course`)
- **Decisión:** Se referenció guardando el `instructor: ObjectId` en el documento `Course`.
- **Justificación:**
  - **Crecimiento sin límites (Anti-patrón de arrays no acotados):** Si un instructor crea cientos o miles de cursos, guardar un array gigante de IDs dentro de `User` puede degradar el rendimiento y arriesgar el límite de tamaño de documento. Al colocar la referencia en el "muchos" (`Course`), la relación escala horizontalmente sin límites.
  - **Consultas directas:** Permite buscar y filtrar cursos fácilmente por instructor (`Course.find({ instructor: id })`).

### 4. Relación N:M: Cursos y Etiquetas (`Course` <-> `Tag`)
- **Decisión:** Se implementó mediante un array de referencias `tags: [ObjectId]` dentro de `Course`.
- **Justificación:**
  - **Independencia de entidades:** Tanto los cursos como las etiquetas existen por sí mismos. Un tag puede compartirse entre múltiples cursos y un curso puede tener múltiples etiquetas temáticas.
  - **Normalización de taxonomía:** Si se renombra o modifica una etiqueta, el cambio se refleja en todos los cursos sin tener que actualizar cientos de documentos embebidos.

---

## 🔍 Sección de Investigación y Aplicación Práctica

### 1. ¿Cómo se utiliza el `populate` desde las colecciones que no tienen referencias? (Virtual Populate)
En MongoDB tradicional, si una colección (por ejemplo `Tag`) no contiene un campo que apunte a `Course`, una consulta directa no sabría cómo resolver la relación sin hacer un `$lookup` en un aggregation pipeline.

Mongoose provee una característica denominada **Virtual Populate**. Permite definir un campo virtual en el esquema que especifica la colección foránea, el campo local y el campo remoto, sin persistir nada en disco:

```javascript
// En src/models/tag.model.js
tagSchema.virtual("courses", {
  ref: "Course",          // Modelo foráneo
  localField: "_id",      // Campo en el documento actual (Tag)
  foreignField: "tags",   // Campo en el modelo foráneo (Course) donde está el ID de Tag
  match: { isDeleted: false } // Filtra solo los cursos activos
});
```

**Aplicación en la práctica:**
Al consultar un Tag por ID (`GET /api/tags/:id`), ejecutamos:
```javascript
const tag = await TagModel.findOne({ _id: id, isDeleted: false })
  .populate("courses", "title description price instructor");
```
Mongoose automáticamente ejecuta la búsqueda inversa y llena la propiedad `courses` con todos los cursos vinculados, demostrando la resolución de relaciones inversas sin redundancia.

---

### 2. ¿Cómo se realizan las eliminaciones lógicas y en cascada?

#### Eliminación Lógica (Soft Delete)
En lugar de invocar `findByIdAndDelete()` o `deleteOne()` (que destruyen los registros y rompen el historial de auditoría), agregamos banderas de control:
```javascript
isDeleted: { type: Boolean, default: false },
deletedAt: { type: Date, default: null }
```
Al solicitar una eliminación:
```javascript
user.isDeleted = true;
user.deletedAt = new Date();
await user.save();
```
Y todas las consultas (`find`, `findOne`) aplican el filtro `{ isDeleted: false }`.

#### Eliminación en Cascada
Cuando una entidad padre se elimina lógicamente, se desencadena la baja lógica de sus entidades dependientes de forma coordinada:
```javascript
// En src/controllers/user.controller.js (deleteUser)
// 1. Marcar usuario como eliminado
user.isDeleted = true;
user.deletedAt = new Date();
await user.save();

// 2. Cascada 1:1 -> Eliminar perfil asociado
await ProfileModel.updateMany(
  { user: id, isDeleted: false },
  { isDeleted: true, deletedAt: new Date() }
);

// 3. Cascada 1:N -> Eliminar cursos del instructor
await CourseModel.updateMany(
  { instructor: id, isDeleted: false },
  { isDeleted: true, deletedAt: new Date() }
);
```
En el caso de las relaciones N:M, al eliminar un `Tag`, se realiza una actualización en cascada mediante el operador `$pull`:
```javascript
// En src/controllers/tag.controller.js (deleteTag)
await CourseModel.updateMany(
  { tags: id },
  { $pull: { tags: id } }
);
```
De este modo no quedan referencias huérfanas en los cursos.

---

### 3. ¿Cómo crear un endpoint que permita agregar un nuevo vínculo en una relación muchos a muchos?

Se diseñó la ruta:
```http
POST /api/courses/:id/tags
Content-Type: application/json

{
  "tagId": "64f1234567890abcdef12345"
}
```

#### Validaciones con `express-validator`:
1. Valida que `:id` sea un MongoId válido y que el curso exista y esté activo.
2. Valida que `tagId` sea un MongoId válido y que la etiqueta exista y esté activa.
3. **Validación personalizada (`custom`) para evitar duplicados:**
```javascript
body("tagId")
  .isMongoId()
  .custom(async (value, { req }) => {
    const tag = await TagModel.findOne({ _id: value, isDeleted: false });
    if (!tag) throw new Error("La etiqueta no existe o ha sido eliminada");

    const course = await CourseModel.findOne({ _id: req.params.id, isDeleted: false });
    if (course && course.tags.some(t => t.toString() === value)) {
      throw new Error("El vínculo entre el curso y la etiqueta ya existe");
    }
    return true;
  });
```

#### Operación en el Controlador:
Se utiliza el operador `$addToSet` de MongoDB para asegurar a nivel atómico que no haya duplicaciones:
```javascript
const updatedCourse = await CourseModel.findByIdAndUpdate(
  id,
  { $addToSet: { tags: tagId } },
  { new: true }
).populate("instructor", "name email").populate("tags", "name description");
```

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
- Node.js instalado (v18+)
- MongoDB en ejecución local en el puerto `27017`

### Pasos
1. Clonar el repositorio:
   ```bash
   git clone https://github.com/fabiannacevvedo-crypto/mongoose-acevedo-cristian.git
   cd mongoose-acevedo-cristian
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Crear el archivo `.env` a partir del `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Ejecutar el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```

5. O iniciar en modo producción:
   ```bash
   npm start
   ```

6. Ejecutar la suite de pruebas automatizadas End-to-End:
   ```bash
   npm test
   ```

---

## 📌 Documentación de Endpoints de la API

### 👤 Usuarios (`/api/users`)
- `POST /api/users` - Crear un usuario con propiedad embebida `address` (Retorna `201 Created`).
- `GET /api/users` - Listar todos los usuarios activos con populate de `profile` y `courses` (Retorna `200 OK`).
- `GET /api/users/:id` - Obtener un usuario por ID con populate (Retorna `200 OK` o `404 Not Found`).
- `PUT /api/users/:id` - Actualizar datos del usuario mediante `matchedData` (Retorna `200 OK`).
- `DELETE /api/users/:id` - Eliminación lógica y en cascada de perfil y cursos (Retorna `200 OK`).

### 🪪 Perfiles (`/api/profiles`) - Relación 1:1
- `POST /api/profiles` - Crear perfil para un usuario (valida existencia de usuario y que no tenga perfil previo) (Retorna `201 Created`).
- `GET /api/profiles` - Listar perfiles activos con populate de usuario (Retorna `200 OK`).
- `GET /api/profiles/:id` - Obtener perfil por ID (Retorna `200 OK`).
- `PUT /api/profiles/:id` - Actualizar información de perfil (Retorna `200 OK`).
- `DELETE /api/profiles/:id` - Eliminación lógica de perfil y desvinculación en `User` (Retorna `200 OK`).

### 📚 Cursos (`/api/courses`) - Relación 1:N y N:M
- `POST /api/courses` - Crear curso asociando instructor y etiquetas opcionales (Retorna `201 Created`).
- `GET /api/courses` - Listar cursos con populate de `instructor` y `tags` (Retorna `200 OK`).
- `GET /api/courses/:id` - Obtener curso por ID (Retorna `200 OK`).
- `PUT /api/courses/:id` - Actualizar curso (Retorna `200 OK`).
- `DELETE /api/courses/:id` - Eliminación lógica de curso (Retorna `200 OK`).
- `POST /api/courses/:id/tags` - **Vincular etiqueta a curso (N:M)** (Retorna `200 OK`).
- `DELETE /api/courses/:id/tags/:tagId` - Desvincular etiqueta de curso (Retorna `200 OK`).

### 🏷️ Etiquetas (`/api/tags`) - N:M y Virtual Populate
- `POST /api/tags` - Crear etiqueta (Retorna `201 Created`).
- `GET /api/tags` - Listar todas las etiquetas (Retorna `200 OK`).
- `GET /api/tags/:id` - Obtener etiqueta con **Virtual Populate** de sus cursos asociados (Retorna `200 OK`).
- `PUT /api/tags/:id` - Actualizar etiqueta (Retorna `200 OK`).
- `DELETE /api/tags/:id` - Eliminación lógica de etiqueta y cascada con `$pull` en cursos (Retorna `200 OK`).

---

## 🌿 Flujo de Git y Control de Versiones

El proyecto sigue el modelo de ramas requerido:
1. `main` y `develop` parten del mismo commit base.
2. La rama `mongoose-basico` fue creada desde `develop`.
3. Todos los commits de desarrollo se realizaron en `mongoose-basico` con mensajes descriptivos en español siguiendo Conventional Commits:
   - `feat(config): configuracion de conexion a mongodb y estructura base de carpetas`
   - `feat(models): definicion de esquemas y modelos con propiedad embebida y relaciones 1:1, 1:N y N:M`
   - `feat(middlewares): middlewares reutilizables con express-validator y validaciones personalizadas`
   - `feat(controllers): controladores CRUD con try-catch, matchedData, populate y eliminacion en cascada`
   - `feat(routes): definicion de rutas de la api y endpoints para vinculacion N:M`
   - `feat(server): integracion de express en app.js y suite de pruebas e2e automatizadas`
   - `docs: documentacion completa en README.md y guia detallada en EXPLICACION_LOGICA.md`
4. Se realizó un merge limpio sin conflictos de `mongoose-basico` hacia `develop`.
5. Se realizó un merge limpio de `develop` hacia `main`.
6. Todas las ramas fueron subidas al repositorio remoto en GitHub.
