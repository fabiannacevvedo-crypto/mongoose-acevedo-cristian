import mongoose from "mongoose";
import app, { server } from "./app.js";

const BASE_URL = "http://localhost:3000/api";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  await wait(1500); // wait for db connection
  console.log("--- INICIANDO PRUEBAS END-TO-END ---");

  try {
    // 1. Crear un usuario con propiedad embebida address
    console.log("\n1. Probando creación de usuario (con propiedad embebida address)...");
    const userRes = await fetch(`${BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Cristian Acevedo",
        email: `cristian_${Date.now()}@test.com`,
        age: 28,
        address: {
          street: "Av. Principal 123",
          city: "Formosa",
          country: "Argentina",
          postalCode: "3600",
        },
      }),
    });
    const userData = await userRes.json();
    console.log("Status:", userRes.status, "User ID:", userData.data?._id);
    if (userRes.status !== 201) throw new Error("Fallo creación de usuario");
    const userId = userData.data._id;

    // 2. Probando validación de express-validator (error 400 por campos requeridos y tipos)
    console.log("\n2. Probando validación express-validator (esperando 400 Bad Request)...");
    const badUserRes = await fetch(`${BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "A", // too short
        email: "not-an-email",
        age: -5,
      }),
    });
    const badUserData = await badUserRes.json();
    console.log("Status:", badUserRes.status, "Errores recibidos:", badUserData.errors?.length);
    if (badUserRes.status !== 400) throw new Error("Debería haber devuelto 400");

    // 3. Crear Perfil (Relación 1:1 con User)
    console.log("\n3. Probando creación de perfil (Relación 1:1 referenciada)...");
    const profileRes = await fetch(`${BASE_URL}/profiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: userId,
        bio: "Desarrollador Full Stack y Docente",
        phone: "+543704123456",
        website: "https://cristianacevedo.dev",
        github: "https://github.com/fabiannacevvedo-crypto",
      }),
    });
    const profileData = await profileRes.json();
    console.log("Status:", profileRes.status, "Profile ID:", profileData.data?._id);
    if (profileRes.status !== 201) throw new Error("Fallo creación de perfil");
    const profileId = profileData.data._id;

    // 4. Probar que no se pueda duplicar el perfil 1:1
    console.log("\n4. Probando que no permita duplicar el perfil (1:1)...");
    const dupProfileRes = await fetch(`${BASE_URL}/profiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: userId,
        bio: "Otro perfil",
        phone: "+543704999999",
      }),
    });
    console.log("Status:", dupProfileRes.status);
    if (dupProfileRes.status !== 400) throw new Error("Debería rechazar perfil duplicado");

    // 5. Crear Etiqueta (Tag para N:M)
    console.log("\n5. Creando etiquetas (Tag)...");
    const tagRes1 = await fetch(`${BASE_URL}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `NodeJS_${Date.now()}`,
        description: "Entorno de ejecución para JavaScript",
      }),
    });
    const tagData1 = await tagRes1.json();
    console.log("Tag 1 Status:", tagRes1.status, "ID:", tagData1.data?._id);
    const tag1Id = tagData1.data._id;

    const tagRes2 = await fetch(`${BASE_URL}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `MongoDB_${Date.now()}`,
        description: "Base de datos NoSQL documental",
      }),
    });
    const tagData2 = await tagRes2.json();
    console.log("Tag 2 Status:", tagRes2.status, "ID:", tagData2.data?._id);
    const tag2Id = tagData2.data._id;

    // 6. Crear Curso (Relación 1:N con Instructor y N:M con Tags)
    console.log("\n6. Creando curso (1:N con instructor, N:M con tags)...");
    const courseRes = await fetch(`${BASE_URL}/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Backend Avanzado con Mongoose ${Date.now()}`,
        description: "Curso completo de MongoDB, Mongoose y Express",
        price: 99.99,
        instructor: userId,
        tags: [tag1Id],
      }),
    });
    const courseData = await courseRes.json();
    console.log("Course Status:", courseRes.status, "ID:", courseData.data?._id);
    if (courseRes.status !== 201) throw new Error("Fallo creación de curso");
    const courseId = courseData.data._id;

    // 7. Endpoint N:M: Agregar nuevo vínculo curso <-> tag
    console.log("\n7. Probando endpoint de vinculación N:M (POST /courses/:id/tags)...");
    const linkRes = await fetch(`${BASE_URL}/courses/${courseId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId: tag2Id }),
    });
    const linkData = await linkRes.json();
    console.log("Status:", linkRes.status, "Tags count:", linkData.data?.tags?.length);
    if (linkRes.status !== 200) throw new Error("Fallo agregar vínculo N:M");

    // 8. Validar en endpoint N:M que no permita duplicar vínculo
    console.log("\n8. Probando validación de vínculo duplicado en relación N:M...");
    const dupLinkRes = await fetch(`${BASE_URL}/courses/${courseId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId: tag2Id }),
    });
    console.log("Status duplicado:", dupLinkRes.status);
    if (dupLinkRes.status !== 400) throw new Error("Debería rechazar vínculo duplicado");

    // 9. Investigar: Probar populate desde colección sin referencia (Tag -> Virtual Populate Courses)
    console.log("\n9. Probando Virtual Populate desde colección sin referencia (GET /tags/:id)...");
    const tagWithCoursesRes = await fetch(`${BASE_URL}/tags/${tag1Id}`);
    const tagWithCourses = await tagWithCoursesRes.json();
    console.log(
      "Status:",
      tagWithCoursesRes.status,
      "Cursos asociados en Tag virtual:",
      tagWithCourses.data?.courses?.length
    );
    if (!tagWithCourses.data?.courses || tagWithCourses.data.courses.length === 0) {
      throw new Error("Virtual populate de courses falló");
    }

    // 10. Probar consulta con populate en User (trae perfil y cursos 1:N)
    console.log("\n10. Consultando User por ID con populate...");
    const userPopRes = await fetch(`${BASE_URL}/users/${userId}`);
    const userPopData = await userPopRes.json();
    console.log("User populate status:", userPopRes.status);
    console.log("Profile bio:", userPopData.data?.profile?.bio);
    console.log("Courses length:", userPopData.data?.courses?.length);

    // 11. Eliminación lógica y en cascada: Eliminar User
    console.log("\n11. Probando eliminación lógica y en cascada de User...");
    const delUserRes = await fetch(`${BASE_URL}/users/${userId}`, {
      method: "DELETE",
    });
    const delUserData = await delUserRes.json();
    console.log("Delete status:", delUserRes.status, delUserData.msg);

    // Verificar que el usuario no aparece en activos
    const checkUserRes = await fetch(`${BASE_URL}/users/${userId}`);
    console.log("Consultar usuario eliminado retorna status:", checkUserRes.status); // 404

    // Verificar que su perfil quedó en cascada eliminado
    const checkProfileRes = await fetch(`${BASE_URL}/profiles/${profileId}`);
    console.log("Consultar perfil en cascada retorna status:", checkProfileRes.status); // 404

    // Verificar que su curso quedó en cascada eliminado
    const checkCourseRes = await fetch(`${BASE_URL}/courses/${courseId}`);
    console.log("Consultar curso en cascada retorna status:", checkCourseRes.status); // 404

    console.log("\n--- ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE! ---");
  } catch (error) {
    console.error("\nError durante las pruebas:", error);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.connection.close();
    process.exit(process.exitCode || 0);
  }
}

runTests();
