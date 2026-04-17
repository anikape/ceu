import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCichjWlJ0GxF3TSSR75bn6IOnL9Kn-QF0",
  authDomain: "universoadm-38c3b.firebaseapp.com",
  projectId: "universoadm-38c3b",
  storageBucket: "universoadm-38c3b.firebasestorage.app",
  messagingSenderId: "29002299293",
  appId: "1:29002299293:web:5489d519474b013239e174"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const refs = {
  studentForm: document.getElementById("studentForm"),
  teacherForm: document.getElementById("teacherForm"),
  gradeForm: document.getElementById("gradeForm"),
  attendanceForm: document.getElementById("attendanceForm"),
  reportForm: document.getElementById("reportForm"),
  classForm: document.getElementById("classForm"),
  subjectForm: document.getElementById("subjectForm"),

  studentsList: document.getElementById("studentsList"),
  teachersList: document.getElementById("teachersList"),
  gradesList: document.getElementById("gradesList"),
  attendanceList: document.getElementById("attendanceList"),
  classesList: document.getElementById("classesList"),
  subjectsList: document.getElementById("subjectsList"),

  reportResult: document.getElementById("reportResult"),

  gradeStudent: document.getElementById("gradeStudent"),
  attendanceStudent: document.getElementById("attendanceStudent"),
  reportStudent: document.getElementById("reportStudent"),
  studentClass: document.getElementById("studentClass"),
  gradeSubject: document.getElementById("gradeSubject"),

  studentsCount: document.getElementById("studentsCount"),
  teachersCount: document.getElementById("teachersCount"),
  gradesCount: document.getElementById("gradesCount"),
  attendanceCount: document.getElementById("attendanceCount"),

  studentStatus: document.getElementById("studentStatus"),
  teacherStatus: document.getElementById("teacherStatus"),
  gradeStatusMsg: document.getElementById("gradeStatusMsg"),
  attendanceStatusMsg: document.getElementById("attendanceStatusMsg"),
  classStatus: document.getElementById("classStatus"),
  subjectStatus: document.getElementById("subjectStatus"),

  printReportBtn: document.getElementById("printReportBtn"),

  loginOverlay: document.getElementById("loginOverlay"),
  loginForm: document.getElementById("loginForm"),
  loginRole: document.getElementById("loginRole"),
  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  loginStatus: document.getElementById("loginStatus"),
  logoutBtn: document.getElementById("logoutBtn"),
  userBar: document.getElementById("userBar"),
  userInfoText: document.getElementById("userInfoText"),

  classDetailTitle: document.getElementById("classDetailTitle"),
  classDetailList: document.getElementById("classDetailList"),
  classReportResult: document.getElementById("classReportResult"),
  printClassReportBtn: document.getElementById("printClassReportBtn")
};

let students = [];
let teachers = [];
let grades = [];
let attendance = [];
let classes = [];
let subjects = [];
let currentUserProfile = null;
let currentFirebaseUser = null;
let editingStudentId = null;

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab)?.classList.add("active");
  });
});

function showStatus(element, message, type = "success") {
  if (!element) return;
  element.textContent = message;
  element.className = `status ${type}`;
  setTimeout(() => {
    element.textContent = "";
    element.className = "status";
  }, 3000);
}

function getClassNameById(classId) {
  const classItem = classes.find((item) => item.id === classId);
  return classItem ? classItem.name : "Sem turma";
}

function getSubjectNameById(subjectId) {
  const subjectItem = subjects.find((item) => item.id === subjectId);
  return subjectItem ? subjectItem.name : "Sem disciplina";
}

function getVisibleStudents() {
  if (!currentUserProfile) return students;

  if (currentUserProfile.role === "responsavel") {
    return students.filter((student) => student.id === currentUserProfile.studentId);
  }

  return students;
}

async function getUserProfileByUid(uid) {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

function fillStudentSelectsByRole() {
  const visibleStudents = getVisibleStudents();

  const options = visibleStudents.length
    ? visibleStudents
        .map((student) => {
          const turmaNome = student.turmaId
            ? getClassNameById(student.turmaId)
            : (student.className || "Sem turma");

          return `<option value="${student.id}">${student.name} - ${turmaNome}</option>`;
        })
        .join("")
    : `<option value="">Nenhum aluno disponível</option>`;

  if (refs.gradeStudent) refs.gradeStudent.innerHTML = options;
  if (refs.attendanceStudent) refs.attendanceStudent.innerHTML = options;
  if (refs.reportStudent) refs.reportStudent.innerHTML = options;
}

async function loadClasses() {
  const snapshot = await getDocs(query(collection(db, "turmas"), orderBy("name")));
  classes = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));

  if (refs.classesList) {
    refs.classesList.innerHTML = classes.length
      ? classes.map((item) => `
        <div class="item">
          <h4>${item.name}</h4>
          <p><strong>Turno:</strong> ${item.shift}</p>
          <p><strong>Ano letivo:</strong> ${item.year}</p>
          <div class="actions">
            <button class="btn-secondary" onclick="window.openClassDetail('${item.id}')">Abrir turma</button>
            <button class="btn" onclick="window.generateClassReport('${item.id}')">Gerar relatório</button>
          </div>
        </div>
      `).join("")
      : `<div class="empty">Nenhuma turma cadastrada.</div>`;
  }

  if (refs.studentClass) {
    refs.studentClass.innerHTML = classes.length
      ? `<option value="">Selecione uma turma</option>` + classes.map((item) => `
          <option value="${item.id}">${item.name} - ${item.shift}</option>
        `).join("")
      : `<option value="">Nenhuma turma cadastrada</option>`;
  }
}

async function loadSubjects() {
  const snapshot = await getDocs(query(collection(db, "subjects"), orderBy("name")));
  subjects = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));

  if (refs.subjectsList) {
    refs.subjectsList.innerHTML = subjects.length
      ? subjects.map((item) => `
        <div class="item">
          <h4>${item.name}</h4>
          <p><strong>Código:</strong> ${item.code || "-"}</p>
        </div>
      `).join("")
      : `<div class="empty">Nenhuma disciplina cadastrada.</div>`;
  }

  if (refs.gradeSubject) {
    refs.gradeSubject.innerHTML = subjects.length
      ? `<option value="">Selecione uma disciplina</option>` + subjects.map((item) => `
          <option value="${item.id}">${item.name}</option>
        `).join("")
      : `<option value="">Nenhuma disciplina cadastrada</option>`;
  }
}

async function loadStudents() {
  const snapshot = await getDocs(query(collection(db, "students"), orderBy("name")));
  students = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));

  const visibleStudents = getVisibleStudents();
  if (refs.studentsCount) refs.studentsCount.textContent = visibleStudents.length;

  if (refs.studentsList) {
    refs.studentsList.innerHTML = visibleStudents.length
      ? visibleStudents.map((student) => {
          const turmaNome = student.turmaId
            ? getClassNameById(student.turmaId)
            : (student.className || "Sem turma");

          return `
            <div class="item">
              <h4>${student.name}</h4>
              <p><strong>Turma:</strong> ${turmaNome}</p>
              <p><strong>Matrícula:</strong> ${student.registration || "-"}</p>
              <p><strong>Responsável:</strong> ${student.guardian || "Não informado"}</p>
              <p><strong>E-mail do responsável:</strong> ${student.guardianEmail || "Não informado"}</p>
              <p><strong>Observação:</strong> ${student.observation || "Sem observações"}</p>
              ${
                currentUserProfile?.role === "admin" || currentUserProfile?.role === "professor"
                  ? `
                    <div class="actions">
                      <button class="btn-secondary" onclick="window.editStudent('${student.id}')">Editar</button>
                      <button class="btn-danger" onclick="window.deleteStudent('${student.id}')">Excluir</button>
                    </div>
                  `
                  : ""
              }
            </div>
          `;
        }).join("")
      : `<div class="empty">Nenhum aluno disponível.</div>`;
  }

  fillStudentSelectsByRole();
}

async function loadTeachers() {
  const snapshot = await getDocs(query(collection(db, "teachers"), orderBy("name")));
  teachers = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));

  if (refs.teachersCount) refs.teachersCount.textContent = teachers.length;

  if (refs.teachersList) {
    refs.teachersList.innerHTML = teachers.length
      ? teachers.map((teacher) => `
        <div class="item">
          <h4>${teacher.name}</h4>
          <p><strong>Disciplina:</strong> ${teacher.subject || "-"}</p>
          <p><strong>Contato:</strong> ${teacher.contact || "-"}</p>
          <p><strong>E-mail:</strong> ${teacher.email || "-"}</p>
          ${
            currentUserProfile?.role === "admin"
              ? `<div class="actions"><button class="btn-danger" onclick="window.deleteTeacher('${teacher.id}')">Excluir</button></div>`
              : ""
          }
        </div>
      `).join("")
      : `<div class="empty">Nenhum professor cadastrado.</div>`;
  }
}

async function loadGrades() {
  const snapshot = await getDocs(collection(db, "grades"));
  grades = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));

  const visibleStudentIds = new Set(getVisibleStudents().map((s) => s.id));
  const visibleGrades = currentUserProfile?.role === "responsavel"
    ? grades.filter((grade) => visibleStudentIds.has(grade.studentId))
    : grades;

  if (refs.gradesCount) refs.gradesCount.textContent = visibleGrades.length;

  if (refs.gradesList) {
    refs.gradesList.innerHTML = visibleGrades.length
      ? visibleGrades.map((grade) => {
          const student = students.find((s) => s.id === grade.studentId);
          const subjectName = grade.subjectId
            ? getSubjectNameById(grade.subjectId)
            : (grade.subject || "Sem disciplina");

          return `
            <div class="item">
              <h4>${student?.name || "Aluno não encontrado"}</h4>
              <p><strong>Disciplina:</strong> ${subjectName}</p>
              <p><strong>Período:</strong> ${grade.term}</p>
              <p><strong>Nota:</strong> ${grade.value}</p>
              <p><strong>Situação:</strong> ${grade.status}</p>
              <p><strong>Observação:</strong> ${grade.observation || "Sem observações"}</p>
              ${
                currentUserProfile?.role === "admin" || currentUserProfile?.role === "professor"
                  ? `<div class="actions"><button class="btn-danger" onclick="window.deleteGrade('${grade.id}')">Excluir</button></div>`
                  : ""
              }
            </div>
          `;
        }).join("")
      : `<div class="empty">Nenhuma nota registrada.</div>`;
  }
}

async function loadAttendance() {
  const snapshot = await getDocs(collection(db, "attendance"));
  attendance = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));

  const visibleStudentIds = new Set(getVisibleStudents().map((s) => s.id));
  const visibleAttendance = currentUserProfile?.role === "responsavel"
    ? attendance.filter((item) => visibleStudentIds.has(item.studentId))
    : attendance;

  if (refs.attendanceCount) refs.attendanceCount.textContent = visibleAttendance.length;

  if (refs.attendanceList) {
    refs.attendanceList.innerHTML = visibleAttendance.length
      ? visibleAttendance.map((record) => {
          const student = students.find((s) => s.id === record.studentId);

          return `
            <div class="item">
              <h4>${student?.name || "Aluno não encontrado"}</h4>
              <p><strong>Data:</strong> ${record.date}</p>
              <p><strong>Status:</strong> ${record.status}</p>
              <p><strong>Observação:</strong> ${record.observation || "Sem observações"}</p>
              ${
                currentUserProfile?.role === "admin" || currentUserProfile?.role === "professor"
                  ? `<div class="actions"><button class="btn-danger" onclick="window.deleteAttendance('${record.id}')">Excluir</button></div>`
                  : ""
              }
            </div>
          `;
        }).join("")
      : `<div class="empty">Nenhum registro de presença.</div>`;
  }
}

function applyPermissions() {
  const role = currentUserProfile?.role;
  const isAdmin = role === "admin";
  const isProfessor = role === "professor";
  const isResponsavel = role === "responsavel";

  const studentCard = refs.studentForm?.closest(".card");
  const teacherCard = refs.teacherForm?.closest(".card");
  const gradeCard = refs.gradeForm?.closest(".card");
  const attendanceCard = refs.attendanceForm?.closest(".card");
  const classCard = refs.classForm?.closest(".card");
  const subjectCard = refs.subjectForm?.closest(".card");

  if (studentCard) studentCard.style.display = isAdmin || isProfessor ? "block" : "none";
  if (teacherCard) teacherCard.style.display = isAdmin ? "block" : "none";
  if (gradeCard) gradeCard.style.display = isAdmin || isProfessor ? "block" : "none";
  if (attendanceCard) attendanceCard.style.display = isAdmin || isProfessor ? "block" : "none";
  if (classCard) classCard.style.display = isAdmin ? "block" : "none";
  if (subjectCard) subjectCard.style.display = isAdmin || isProfessor ? "block" : "none";

  const professoresBtn = [...document.querySelectorAll(".tab-btn")].find(
    (btn) => btn.dataset.tab === "professores"
  );
  const turmasBtn = [...document.querySelectorAll(".tab-btn")].find(
    (btn) => btn.dataset.tab === "turmas"
  );
  const disciplinasBtn = [...document.querySelectorAll(".tab-btn")].find(
    (btn) => btn.dataset.tab === "disciplinas"
  );
  const notasBtn = [...document.querySelectorAll(".tab-btn")].find(
    (btn) => btn.dataset.tab === "notas"
  );
  const faltasBtn = [...document.querySelectorAll(".tab-btn")].find(
    (btn) => btn.dataset.tab === "faltas"
  );
  const alunosBtn = [...document.querySelectorAll(".tab-btn")].find(
    (btn) => btn.dataset.tab === "alunos"
  );

  if (professoresBtn) professoresBtn.style.display = isResponsavel ? "none" : "inline-block";
  if (turmasBtn) turmasBtn.style.display = isResponsavel ? "none" : "inline-block";
  if (disciplinasBtn) disciplinasBtn.style.display = isResponsavel ? "none" : "inline-block";
  if (notasBtn) notasBtn.style.display = isResponsavel ? "none" : "inline-block";
  if (faltasBtn) faltasBtn.style.display = isResponsavel ? "none" : "inline-block";
  if (alunosBtn) alunosBtn.style.display = isResponsavel ? "none" : "inline-block";

  if (refs.userBar) refs.userBar.style.display = "flex";
  if (refs.userInfoText) {
    refs.userInfoText.textContent = `Perfil: ${role} | Usuário: ${
      currentUserProfile?.name || currentFirebaseUser?.email || ""
    }`;
  }

  if (isResponsavel) {
    document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"));
    document.querySelector('[data-tab="relatorios"]')?.classList.add("active");
    document.getElementById("relatorios")?.classList.add("active");
  }
}
function generateStudentReport(studentId) {
  const student = students.find((s) => s.id === studentId);
  if (!student) {
    if (refs.reportResult) refs.reportResult.innerHTML = `<p>Aluno não encontrado.</p>`;
    return;
  }

  const allowed =
    currentUserProfile?.role !== "responsavel" ||
    currentUserProfile.studentId === studentId;

  if (!allowed) {
    if (refs.reportResult) refs.reportResult.innerHTML = `<p>Você não tem permissão para visualizar este relatório.</p>`;
    return;
  }

  const studentGrades = grades.filter((g) => g.studentId === studentId);
  const studentAttendance = attendance.filter((a) => a.studentId === studentId);
  const turmaNome = student.turmaId ? getClassNameById(student.turmaId) : (student.className || "Sem turma");

  const average = studentGrades.length
    ? (studentGrades.reduce((sum, item) => sum + Number(item.value), 0) / studentGrades.length).toFixed(2)
    : "0.00";

  const totalClasses = studentAttendance.length;
  const absences = studentAttendance.filter((item) => item.status === "Falta").length;
  const presence = studentAttendance.filter((item) => item.status === "Presente").length;
  const frequency = totalClasses ? ((presence / totalClasses) * 100).toFixed(1) : "0.0";

  if (refs.reportResult) {
    refs.reportResult.innerHTML = `
      <p><strong>Aluno:</strong> ${student.name}</p>
      <p><strong>Turma:</strong> ${turmaNome}</p>
      <p><strong>Matrícula:</strong> ${student.registration || "-"}</p>
      <p><strong>Responsável:</strong> ${student.guardian || "Não informado"}</p>
<p><strong>E-mail do responsável:</strong> ${student.guardianEmail || "Não informado"}</p>
<p><strong>Observação:</strong> ${student.observation || "Sem observações"}</p>
      <hr style="margin: 14px 0; border: 1px solid #eee;">
      <p><strong>Média:</strong> ${average}</p>
      <p><strong>Total de notas:</strong> ${studentGrades.length}</p>
      <p><strong>Total de presenças:</strong> ${presence}</p>
      <p><strong>Total de faltas:</strong> ${absences}</p>
      <p><strong>Frequência:</strong> ${frequency}%</p>
      <hr style="margin: 14px 0; border: 1px solid #eee;">
      <p><strong>Notas:</strong></p>
      ${
        studentGrades.length
          ? studentGrades.map((item) => `
              <p>- ${item.subjectId ? getSubjectNameById(item.subjectId) : item.subject} | ${item.term} | Nota: ${item.value} | ${item.status}<br>
              <em>Obs.:</em> ${item.observation || "Sem observação"}</p>
            `).join("")
          : "<p>Nenhuma nota registrada.</p>"
      }
    `;
  }
}

window.openClassDetail = (classId) => {
  const turma = classes.find((item) => item.id === classId);
  if (!turma) return;

  const classStudents = students
    .filter((student) => student.turmaId === classId)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  if (refs.classDetailTitle) {
    refs.classDetailTitle.textContent = `Detalhes da Turma - ${turma.name}`;
  }

  if (refs.classDetailList) {
    refs.classDetailList.innerHTML = classStudents.length
      ? classStudents.map((student) => {
          const studentGrades = grades.filter((item) => item.studentId === student.id);
          const studentAttendance = attendance.filter((item) => item.studentId === student.id);

          const faltas = studentAttendance.filter((item) => item.status === "Falta").length;
          const presencas = studentAttendance.filter((item) => item.status === "Presente").length;

          const media = studentGrades.length
            ? (
                studentGrades.reduce((sum, item) => sum + Number(item.value || 0), 0) /
                studentGrades.length
              ).toFixed(2)
            : "0.00";

          return `
            <div class="item">
              <h4>${student.name}</h4>
              <p><strong>Matrícula:</strong> ${student.registration || "-"}</p>
              <p><strong>Responsável:</strong> ${student.guardian || "-"}</p>
              <p><strong>Média:</strong> ${media}</p>
              <p><strong>Presenças:</strong> ${presencas}</p>
              <p><strong>Faltas:</strong> ${faltas}</p>
              <p><strong>Notas:</strong></p>
              ${
                studentGrades.length
                  ? studentGrades.map((grade) => `
                    <p>- ${grade.subject || getSubjectNameById(grade.subjectId)} | ${grade.term} | Nota: ${grade.value}</p>
                  `).join("")
                  : "<p>Nenhuma nota registrada.</p>"
              }
            </div>
          `;
        }).join("")
      : `<div class="empty">Nenhum aluno cadastrado nesta turma.</div>`;
  }

  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"));
  document.getElementById("turmaDetalhe")?.classList.add("active");
};

window.generateClassReport = (classId) => {
  const turma = classes.find((item) => item.id === classId);
  if (!turma) return;

  const classStudents = students
    .filter((student) => student.turmaId === classId)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  let html = `
    <p><strong>Turma:</strong> ${turma.name}</p>
    <p><strong>Turno:</strong> ${turma.shift}</p>
    <p><strong>Ano letivo:</strong> ${turma.year}</p>
    <hr style="margin: 14px 0; border: 1px solid #eee;">
  `;

  if (!classStudents.length) {
    html += `<p>Nenhum aluno cadastrado nesta turma.</p>`;
  } else {
    classStudents.forEach((student) => {
      const studentGrades = grades.filter((item) => item.studentId === student.id);
      const studentAttendance = attendance.filter((item) => item.studentId === student.id);

      const faltas = studentAttendance.filter((item) => item.status === "Falta").length;
      const presencas = studentAttendance.filter((item) => item.status === "Presente").length;

      const media = studentGrades.length
        ? (
            studentGrades.reduce((sum, item) => sum + Number(item.value || 0), 0) /
            studentGrades.length
          ).toFixed(2)
        : "0.00";

      html += `
        <div style="margin-bottom: 16px;">
          <p><strong>Aluno:</strong> ${student.name}</p>
          <p><strong>Matrícula:</strong> ${student.registration || "-"}</p>
          <p><strong>Média:</strong> ${media}</p>
          <p><strong>Presenças:</strong> ${presencas}</p>
          <p><strong>Faltas:</strong> ${faltas}</p>
          <p><strong>Notas:</strong></p>
          ${
            studentGrades.length
              ? studentGrades.map((grade) => `
                <p>- ${grade.subject || getSubjectNameById(grade.subjectId)} | ${grade.term} | Nota: ${grade.value}</p>
              `).join("")
              : "<p>Nenhuma nota registrada.</p>"
          }
          <hr style="margin: 10px 0; border: 1px solid #eee;">
        </div>
      `;
    });
  }

  if (refs.classReportResult) {
    refs.classReportResult.innerHTML = html;
  }

  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"));
  document.getElementById("turmaDetalhe")?.classList.add("active");
};

window.editStudent = (id) => {
  const student = students.find((item) => item.id === id);
  if (!student) return;

  editingStudentId = id;

  document.getElementById("studentName").value = student.name || "";
  document.getElementById("studentClass").value = student.turmaId || "";
  document.getElementById("studentRegistration").value = student.registration || "";
  document.getElementById("studentGuardian").value = student.guardian || "";
  document.getElementById("studentGuardianEmail").value = student.guardianEmail || "";
  document.getElementById("studentObservation").value = student.observation || "";

  const submitButton = refs.studentForm?.querySelector('button[type="submit"]');
  if (submitButton) submitButton.textContent = "Atualizar aluno";
};

refs.loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      refs.loginEmail.value,
      refs.loginPassword.value
    );

    const profile = await getUserProfileByUid(credential.user.uid);

    if (!profile) {
      showStatus(refs.loginStatus, "Usuário sem perfil cadastrado.", "error");
      await signOut(auth);
      return;
    }

    if (profile.role !== refs.loginRole.value) {
      showStatus(refs.loginStatus, "O perfil selecionado não corresponde ao usuário.", "error");
      await signOut(auth);
      return;
    }

    currentUserProfile = profile;
    currentFirebaseUser = credential.user;

    if (refs.loginOverlay) refs.loginOverlay.style.display = "none";
    applyPermissions();
    await initData();
  } catch (error) {
    console.error(error);
    showStatus(refs.loginStatus, "Erro no login.", "error");
  }
});

refs.logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  location.reload();
});

refs.classForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    await addDoc(collection(db, "turmas"), {
      name: document.getElementById("className").value,
      shift: document.getElementById("classShift").value,
      year: Number(document.getElementById("classYear").value),
      teacherId: "",
      createdAt: new Date().toISOString()
    });

    refs.classForm.reset();
    showStatus(refs.classStatus, "Turma salva com sucesso.");
    await loadClasses();
  } catch (error) {
    console.error(error);
    showStatus(refs.classStatus, "Erro ao salvar turma.", "error");
  }
});

refs.subjectForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    await addDoc(collection(db, "subjects"), {
      name: document.getElementById("subjectName").value,
      code: document.getElementById("subjectCode").value,
      createdAt: new Date().toISOString()
    });

    refs.subjectForm.reset();
    showStatus(refs.subjectStatus, "Disciplina salva com sucesso.");
    await loadSubjects();
  } catch (error) {
    console.error(error);
    showStatus(refs.subjectStatus, "Erro ao salvar disciplina.", "error");
  }
});

refs.studentForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const selectedClassId = document.getElementById("studentClass").value;
    const selectedClass = classes.find((item) => item.id === selectedClassId);

  const studentData = {
  name: document.getElementById("studentName").value,
  className: selectedClass ? selectedClass.name : "",
  turmaId: selectedClassId,
  registration: document.getElementById("studentRegistration").value,
  guardian: document.getElementById("studentGuardian").value,
  guardianEmail: document.getElementById("studentGuardianEmail").value,
  observation: document.getElementById("studentObservation").value
};

    if (editingStudentId) {
      await updateDoc(doc(db, "students", editingStudentId), studentData);
      showStatus(refs.studentStatus, "Aluno atualizado com sucesso.");
      editingStudentId = null;

      const submitButton = refs.studentForm?.querySelector('button[type="submit"]');
      if (submitButton) submitButton.textContent = "Salvar aluno";
    } else {
      await addDoc(collection(db, "students"), {
        ...studentData,
        createdAt: new Date().toISOString()
      });
      showStatus(refs.studentStatus, "Aluno salvo com sucesso.");
    }

    refs.studentForm.reset();
    await loadStudents();
    await loadClasses();
  } catch (error) {
    console.error(error);
    showStatus(refs.studentStatus, "Erro ao salvar aluno.", "error");
  }
});

refs.teacherForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    await addDoc(collection(db, "teachers"), {
      name: document.getElementById("teacherName").value,
      subject: document.getElementById("teacherSubject").value,
      contact: document.getElementById("teacherContact").value,
      email: "",
      uid: "",
      createdAt: new Date().toISOString()
    });

    refs.teacherForm.reset();
    showStatus(refs.teacherStatus, "Professor salvo com sucesso.");
    await loadTeachers();
  } catch (error) {
    console.error(error);
    showStatus(refs.teacherStatus, "Erro ao salvar professor.", "error");
  }
});

refs.gradeForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const studentId = refs.gradeStudent.value;
    const student = students.find((item) => item.id === studentId);

    const subjectId = refs.gradeSubject.value;
    const selectedSubject = subjects.find((item) => item.id === subjectId);

    await addDoc(collection(db, "grades"), {
      studentId,
      turmaId: student?.turmaId || "",
      subjectId,
      subject: selectedSubject ? selectedSubject.name : "",
      term: document.getElementById("gradeTerm").value,
      value: Number(document.getElementById("gradeValue").value),
      status: document.getElementById("gradeStatus").value,
      observation: document.getElementById("gradeObservation").value,
      createdAt: new Date().toISOString()
    });

    refs.gradeForm.reset();
    showStatus(refs.gradeStatusMsg, "Nota salva com sucesso.");
    await loadGrades();
    await loadSubjects();
  } catch (error) {
    console.error(error);
    showStatus(refs.gradeStatusMsg, "Erro ao salvar nota.", "error");
  }
});

refs.attendanceForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const studentId = refs.attendanceStudent.value;
    const student = students.find((item) => item.id === studentId);

    await addDoc(collection(db, "attendance"), {
      studentId,
      turmaId: student?.turmaId || "",
      date: document.getElementById("attendanceDate").value,
      status: document.getElementById("attendanceStatus").value,
      observation: document.getElementById("attendanceObservation").value,
      createdAt: new Date().toISOString()
    });

    refs.attendanceForm.reset();
    showStatus(refs.attendanceStatusMsg, "Presença salva com sucesso.");
    await loadAttendance();
  } catch (error) {
    console.error(error);
    showStatus(refs.attendanceStatusMsg, "Erro ao salvar presença.", "error");
  }
});

refs.reportForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  generateStudentReport(refs.reportStudent.value);
});

refs.printReportBtn?.addEventListener("click", () => window.print());
refs.printClassReportBtn?.addEventListener("click", () => window.print());

window.deleteStudent = async (id) => {
  if (!(currentUserProfile?.role === "admin" || currentUserProfile?.role === "professor")) return;
  if (!confirm("Deseja excluir este aluno?")) return;

  await deleteDoc(doc(db, "students", id));
  await loadStudents();
};

window.deleteTeacher = async (id) => {
  if (currentUserProfile?.role !== "admin") return;
  if (!confirm("Deseja excluir este professor?")) return;

  await deleteDoc(doc(db, "teachers", id));
  await loadTeachers();
};

window.deleteGrade = async (id) => {
  if (!(currentUserProfile?.role === "admin" || currentUserProfile?.role === "professor")) return;
  if (!confirm("Deseja excluir esta nota?")) return;

  await deleteDoc(doc(db, "grades", id));
  await loadGrades();
};

window.deleteAttendance = async (id) => {
  if (!(currentUserProfile?.role === "admin" || currentUserProfile?.role === "professor")) return;
  if (!confirm("Deseja excluir este registro?")) return;

  await deleteDoc(doc(db, "attendance", id));
  await loadAttendance();
};

async function initData() {
  await Promise.all([
    loadClasses(),
    loadSubjects(),
    loadStudents(),
    loadTeachers(),
    loadGrades(),
    loadAttendance()
  ]);

  if (currentUserProfile?.role === "responsavel" && currentUserProfile.studentId) {
    generateStudentReport(currentUserProfile.studentId);
  }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  currentFirebaseUser = user;
  const profile = await getUserProfileByUid(user.uid);

  if (!profile) return;

  currentUserProfile = profile;

  if (refs.loginOverlay) refs.loginOverlay.style.display = "none";
  applyPermissions();
  await initData();
});