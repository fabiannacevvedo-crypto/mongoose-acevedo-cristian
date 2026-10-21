# Explicación Detallada de la Lógica del Sistema

**Autor:** Cristian Acevedo  
**Proyecto:** `mongoose-acevedo-cristian`  
**Institución:** Instituto Politécnico Formosa  
**Documento Complementario:** Guía de Arquitectura, Lógica y Flujos de Datos

---

## 🧭 1. Introducción y Propósito

El objetivo de este documento es explicar en profundidad la arquitectura, lógica de negocio y decisiones técnicas adoptadas para cumplir al pie de la letra con los requisitos de la práctica de MongoDB y Mongoose.

Se buscó reflejar fielmente la convención sintáctica y el estilo de código del repositorio de referencia (`material-unidad-3-2do-cuatrimestre-2026`), pero elevándolo a un nivel productivo, modularizado, tipado y completamente validado.

---

## 🏛️ 2. Arquitectura por Capas

El proyecto está organizado en una arquitectura por capas desacoplada y orientada a responsabilidades únicas:

```
[ Petición HTTP entrante (Cliente / Postman / Frontend) ]
                       │
                       ▼
        [ app.js (Middlewares Globales) ]
           - express.json()
           - cookieParser()
           - cors()
                       │
                       ▼
             [ src/routes/*.js ]
      (Mapeo de método HTTP y URL a controladores)
                       │
                       ▼
          [ src/middlewares/*.js ]
      - express-validator (tipos, longitudes, formato)
      - custom() asíncronos (búsqueda en BD: unicidad y existencia)
      - validateResult (si hay fallos, responde 400 Bad Request)
                       │
                       ▼
         [ src/controllers/*.js ]
      - try / catch obligatorio
      - matchedData(req) (solo datos saneados y validados)
      - Lógica CRUD, Populate y Cascadas
      - Respuestas HTTP (200, 201, 404, 500)
                       │
                       ▼
            [ src/models/*.js ]
      - Definición de Schemas Mongoose
      - Tipos BSON, Hooks, Virtuals
                       │
                       ▼
       [ Base de Datos: MongoDB Local ]
```

### ¿Por qué esta estructura?
1. **Separación de Responsabilidades:** Las rutas solo enrutan; los validadores solo inspeccionan datos; los controladores solo orquestan negocio; y los modelos solo conocen la estructura de datos.
2. **Mantenibilidad:** Si las reglas de validación de un email o una contraseña cambian, solo se edita `user.validator.js`, dejando intacto el controlador.
3. **Seguridad contra Inyección:** `matchedData(req)` filtra cualquier campo no declarado que un atacante envíe en el body JSON.

---

## 📊 3. Diseño del Modelo de Datos y Relaciones

El sistema gestiona una plataforma educativa (Cursos, Instructores, Perfiles y Etiquetas):

```
 ┌────────────────────────────────────────┐
 │                 USER                   │
 │ ────────────────────────────────────── │
 │ - _id: ObjectId                        │
 │ - name: String                         │
 │ - email: String (único)                │
 │ - age: Number                          │
 │ - address: {                           │ <── [PROPIEDAD EMBEBIDA]
 │     street, city, country, postalCode  │
 │   }                                    │
 │ - profile: ObjectId (ref: Profile)     │ <── [RELACIÓN 1:1]
 │ - isDeleted: Boolean                   │
 └──────────────────┬─────────────────────┘
                    │
                    │ 1:1
                    ▼
 ┌────────────────────────────────────────┐
 │                PROFILE                 │
 │ ────────────────────────────────────── │
 │ - _id: ObjectId                        │
 │ - user: ObjectId (ref: User, UNIQUE)   │
 │ - bio: String                          │
 │ - phone: String                        │
 │ - website: String                      │
 │ - github: String                       │
 └────────────────────────────────────────┘
                    ▲
                    │ 1:N (Instructor)
                    │
 ┌──────────────────┴─────────────────────┐
 │                COURSE                  │
 │ ────────────────────────────────────── │
 │ - _id: ObjectId                        │
 │ - title: String (único)                │
 │ - description: String                  │
 │ - price: Number                        │
 │ - instructor: ObjectId (ref: User)     │ <── [RELACIÓN 1:N]
 │ - tags: [ ObjectId (ref: Tag) ]        │ <── [RELACIÓN N:M]
 │ - isDeleted: Boolean                   │
 └──────────────────┬─────────────────────┘
                    │
                    │ N:M
                    ▼
 ┌────────────────────────────────────────┐
 │                 TAG                    │
 │ ────────────────────────────────────── │
 │ - _id: ObjectId                        │
 │ - name: String (único)                 │
 │ - description: String                  │
 │ [Virtual: courses] (Virtual Populate)  │ <── [POPULATE SIN REFERENCIA]
 └────────────────────────────────────────┘
```

---

## 🧩 4. Análisis de las Relaciones y Decisiones

### A. Propiedad Embebida (`User.address`)
- **Problema que resuelve:** Una dirección no existe en el vacío; existe en función del usuario. Consultar al usuario y tener que hacer un join adicional para saber su calle o ciudad resultaría ineficiente.
- **Implementación:** Se crea un `addressSchema` con `{ _id: false }` para evitar IDs innecesarios en el subdocumento, embebido directamente en `userSchema`.
- **Validación:** Se valida con `express-validator` tanto la presencia del objeto como cada una de sus claves (`address.street`, `address.city`, etc.).

### B. Relación 1:1 (`User` <-> `Profile`)
- **Problema que resuelve:** Mantener los datos pesados (biografía extensa, enlaces de perfil, teléfono) fuera del documento principal del usuario, agilizando listados de usuarios.
- **Implementación:** 
  - `Profile` contiene `user: { type: ObjectId, ref: 'User', unique: true }`.
  - El middleware `createProfileValidator` consulta en la base de datos si el usuario ya tiene un perfil activo:
    ```javascript
    const existing = await ProfileModel.findOne({ user: value, isDeleted: false });
    if (existing) throw new Error("El usuario ya posee un perfil activo.");
    ```
  - Al crearse el perfil, el controlador actualiza bidireccionalmente el campo `profile` en `User`.

### C. Relación 1:N (`User` <-> `Course`)
- **Problema que resuelve:** Un profesor/instructor puede impartir múltiples cursos a lo largo del tiempo.
- **Implementación:**
  - El curso guarda `instructor: { type: ObjectId, ref: 'User' }`.
  - En `User` no se guarda un array de IDs (evitando arrays no acotados que pueden saturar los 16MB de BSON). En su lugar, se define un **Virtual Field**:
    ```javascript
    userSchema.virtual("courses", {
      ref: "Course",
      localField: "_id",
      foreignField: "instructor",
    });
    ```
  - Al hacer `UserModel.find().populate("courses")`, Mongoose une los cursos en tiempo de consulta de manera totalmente transparente.

### D. Relación N:M (`Course` <-> `Tag`)
- **Problema que resuelve:** Un curso puede tratar de múltiples tecnologías (`NodeJS`, `MongoDB`, `Express`), y una tecnología engloba múltiples cursos.
- **Implementación:**
  - `Course` almacena un array de IDs de etiquetas: `tags: [{ type: ObjectId, ref: 'Tag' }]`.
  - Se desarrolló un endpoint específico `POST /api/courses/:id/tags` para añadir un vínculo nuevo.
  - El middleware `addTagToCourseValidator` verifica que ambos documentos existan y que no esté duplicado el vínculo con `.some()`.
  - El controlador utiliza `$addToSet`, garantizando que la operación sea idempotente a nivel de base de datos.

---

## 🔬 5. Lógica de las Consignas de Investigación

### A. Populate desde colecciones sin referencias directas (Virtual Populate)
Normalmente, para que `.populate()` funcione en Mongoose, el esquema debe tener un campo con `ref`. Sin embargo, en nuestro modelo, la colección `Tag` **no** tiene ningún campo que guarde cursos; son los cursos los que guardan el tag.

¿Cómo hacemos para consultar un Tag y que nos devuelva todos sus cursos?
Mediante **Virtual Populate**:
```javascript
tagSchema.virtual("courses", {
  ref: "Course",          // Modelo destino
  localField: "_id",      // Campo local
  foreignField: "tags",   // Campo foráneo donde se encuentra nuestro _id
  match: { isDeleted: false } // Filtrar bajas lógicas
});
```
Al invocar:
```javascript
const tag = await TagModel.findById(id).populate("courses");
```
Mongoose efectúa internamente una búsqueda en `Course` equivalente a `Course.find({ tags: id })` y lo inyecta en la propiedad virtual `.courses`.

### B. Eliminaciones Lógicas (Soft Delete) y en Cascada
1. **¿Por qué no borrar físicamente (`deleteOne`)?**
   - Eliminar físicamente un registro produce pérdida irreversible de datos, inconsistencias en registros históricos de pagos/inscripciones y puede causar errores de referencias rotas en cascada.
2. **Implementación de Soft Delete:**
   - Todos los esquemas cuentan con `isDeleted: Boolean` y `deletedAt: Date`.
   - Todas las lecturas (`find`, `findOne`) incluyen `{ isDeleted: false }`.
3. **Implementación de Cascada:**
   - Si un usuario es eliminado lógicamente (`DELETE /api/users/:id`):
     1. Se actualiza el usuario: `isDeleted = true, deletedAt = new Date()`.
     2. Cascada 1:1: Se marca como eliminado su `Profile` (`ProfileModel.updateMany({ user: id }, ...)`).
     3. Cascada 1:N: Se marcan como eliminados todos sus `Course` (`CourseModel.updateMany({ instructor: id }, ...)`).
   - Si una etiqueta es eliminada (`DELETE /api/tags/:id`):
     - Se remueve la etiqueta de todos los cursos mediante `$pull`:
       ```javascript
       await CourseModel.updateMany({ tags: id }, { $pull: { tags: id } });
       ```

---

## 🛡️ 6. Estrategia de Validación con `express-validator`

En lugar de validar manualmente dentro del controlador con bloques `if (!nombre) return res.status(400)...`, se diseñó una cadena de validación declarativa:

1. **Middleware Reutilizable (`validateResult`):**
   ```javascript
   export const validateResult = (req, res, next) => {
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return res.status(400).json({
         msg: "Errores de validación",
         errors: errors.array(),
       });
     }
     next();
   };
   ```
2. **Validación de IDs de MongoDB (`isMongoId`):**
   Garantiza que ningún ID con formato inválido llegue a `Mongoose`, previniendo excepciones no controladas de `CastError`.
3. **Validaciones Asíncronas en Base de Datos (`.custom(async ...)`):**
   - Verifica existencia de claves foráneas antes de crear registros dependientes.
   - Verifica unicidad lógica de emails, nombres de etiquetas y títulos de cursos ignorando registros previamente eliminados.
4. **Uso de `matchedData()`:**
   En cada controlador se extraen únicamente las propiedades saneadas y explícitamente autorizadas por los validadores, impidiendo ataques de "Mass Assignment".

---

## 🔄 7. Control de Flujo de Git

El historial de Git sigue de forma matemática las consignas de la cátedra:
1. Las ramas `main` y `develop` arrancaron con el mismo commit inicial base.
2. La rama `mongoose-basico` fue creada desde `develop`.
3. En `mongoose-basico` se produjeron más de 5 commits estructurados en español con la especificación Conventional Commits.
4. Se fusionó limpiamente `mongoose-basico` a `develop`.
5. Se fusionó limpiamente `develop` a `main`.
6. Todas las ramas fueron publicadas en el repositorio remoto `https://github.com/fabiannacevvedo-crypto/mongoose-acevedo-cristian`.

---

## ✅ 8. Conclusión

El proyecto no solo cumple al 100% con cada requisito técnico y académico exigido, sino que proporciona una base sólida, moderna, modular y con pruebas automatizadas que verifican la integridad de cada uno de sus componentes.
