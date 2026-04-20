import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCichjWlJ0GxF3TSSR75bn6IOnL9Kn-QF0",
  authDomain: "universoadm-38c3b.firebaseapp.com",
  projectId: "universoadm-38c3b",
  storageBucket: "universoadm-38c3b.firebasestorage.app",
  messagingSenderId: "29002299293",
  appId: "1:29002299293:web:5489d519474b013239e174",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const refs = {
  // forms
  loginForm: document.getElementById("loginForm"),
  studentForm: document.getElementById("studentForm"),
  teacherForm: document.getElementById("teacherForm"),
  subjectForm: document.getElementById("subjectForm"),
  gradeForm: document.getElementById("gradeForm"),
  attendanceForm: document.getElementById("attendanceForm"),
  reportForm: document.getElementById("reportForm"),
  classForm: document.getElementById("classForm"),
  userForm: document.getElementById("userForm"),

  // auth
  loginOverlay: document.getElementById("loginOverlay"),
  loginRole: document.getElementById("loginRole"),
  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  loginStatus: document.getElementById("loginStatus"),
  logoutBtn: document.getElementById("logoutBtn"),
  userBar: document.getElementById("userBar"),
  userInfoText: document.getElementById("userInfoText"),
  forgotPasswordBtn: document.getElementById("forgotPasswordBtn"),

  // lists
  studentsList: document.getElementById("studentsList"),
  teachersList: document.getElementById("teachersList"),
  subjectsList: document.getElementById("subjectsList"),
  gradesList: document.getElementById("gradesList"),
  attendanceList: document.getElementById("attendanceList"),
  classesList: document.getElementById("classesList"),

  // selects / inputs
  studentClass: document.getElementById("studentClass"),
  gradeStudent: document.getElementById("gradeStudent"),
  gradeSubject: document.getElementById("gradeSubject"),
  attendanceStudent: document.getElementById("attendanceStudent"),
  reportStudent: document.getElementById("reportStudent"),
  userStudent: document.getElementById("userStudent"),

  // metrics
  studentsCount: document.getElementById("studentsCount"),
  teachersCount: document.getElementById("teachersCount"),
  gradesCount: document.getElementById("gradesCount"),
  attendanceCount: document.getElementById("attendanceCount"),

  // statuses
  studentStatus: document.getElementById("studentStatus"),
  teacherStatus: document.getElementById("teacherStatus"),
  subjectStatus: document.getElementById("subjectStatus"),
  gradeStatusMsg: document.getElementById("gradeStatusMsg"),
  attendanceStatusMsg: document.getElementById("attendanceStatusMsg"),
  classStatus: document.getElementById("classStatus"),

  // reports
  reportResult: document.getElementById("reportResult"),
  printReportBtn: document.getElementById("printReportBtn"),
  classDetailTitle: document.getElementById("classDetailTitle"),
  classDetailList: document.getElementById("classDetailList"),
  classReportResult: document.getElementById("classReportResult"),
  printClassReportBtn: document.getElementById("printClassReportBtn"),

  // dashboard
  dashStudents: document.getElementById("dashStudents"),
  dashTeachers: document.getElementById("dashTeachers"),
  dashClasses: document.getElementById("dashClasses"),
  dashAverage: document.getElementById("dashAverage"),
  dashboardChart: document.getElementById("dashboardChart"),
};

let students = [];
let teachers = [];
let subjects = [];
let grades = [];
let attendance = [];
let classes = [];

let currentUserProfile = null;
let currentFirebaseUser = null;

let editingStudentId = null;
let editingTeacherId = null;
let editingSubjectId = null;
let editingClassId = null;
let dashboardChartInstance = null;

function showStatus(element, message, type = "success") {
  if (!element) return;
  element.textContent = message;
  element.className = `status ${type}`;
  setTimeout(() => {
    element.textContent = "";
    element.className = "status";
  }, 3000);
}

function activateTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"));

  document.querySelector(`.tab-btn[data-tab="${tabId}"]`)?.classList.add("active");
  document.getElementById(tabId)?.classList.add("active");
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    activateTab(btn.dataset.tab);
  });
});

function getClassNameById(classId) {
  const item = classes.find((c) => c.id === classId);
  return item ? item.name : "Sem turma";
}

function getSubjectNameById(subjectId) {
  const item = subjects.find((s) => s.id === subjectId);
  return item ? item.name : "Sem disciplina";
}

function getVisibleStudents() {
  if (!currentUserProfile) return students;

  if (currentUserProfile.role === "responsavel") {
    return students.filter((student) => student.id === currentUserProfile.studentId);
  }

  return students;
}

function getVisibleGrades() {
  if (!currentUserProfile) return grades;

  if (currentUserProfile.role === "responsavel") {
    const allowedIds = new Set(getVisibleStudents().map((s) => s.id));
    return grades.filter((g) => allowedIds.has(g.studentId));
  }

  return grades;
}

function getVisibleAttendance() {
  if (!currentUserProfile) return attendance;

  if (currentUserProfile.role === "responsavel") {
    const allowedIds = new Set(getVisibleStudents().map((s) => s.id));
    return attendance.filter((a) => allowedIds.has(a.studentId));
  }

  return attendance;
}

async function getUserProfileByUid(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

function fillStudentSelectsByRole() {
  const visibleStudents = getVisibleStudents();

  const options = visibleStudents.length
    ? visibleStudents
        .map((student) => {
          const turmaNome = student.turmaId
            ? getClassNameById(student.turmaId)
            : student.className || "Sem turma";
          return `<option value="${student.id}">${student.name} - ${turmaNome}</option>`;
        })
        .join("")
    : `<option value="">Nenhum aluno disponível</option>`;

  if (refs.gradeStudent) refs.gradeStudent.innerHTML = options;
  if (refs.attendanceStudent) refs.attendanceStudent.innerHTML = options;
  if (refs.reportStudent) refs.reportStudent.innerHTML = options;

  if (refs.userStudent) {
    refs.userStudent.innerHTML =
      `<option value="">Selecione</option>` +
      students.map((student) => `<option value="${student.id}">${student.name}</option>`).join("");
  }
}

function resetStudentFormButton() {
  const btn = refs.studentForm?.querySelector('button[type="submit"]');
  if (btn) btn.textContent = "Salvar aluno";
}

function resetTeacherFormButton() {
  const btn = refs.teacherForm?.querySelector('button[type="submit"]');
  if (btn) btn.textContent = "Salvar dados do professor";
}

function resetSubjectFormButton() {
  const btn = refs.subjectForm?.querySelector('button[type="submit"]');
  if (btn) btn.textContent = "Salvar disciplina";
}

function resetClassFormButton() {
  const btn = refs.classForm?.querySelector('button[type="submit"]');
  if (btn) btn.textContent = "Salvar turma";
}

function loadDashboard() {
  if (refs.dashStudents) refs.dashStudents.textContent = students.length;
  if (refs.dashTeachers) refs.dashTeachers.textContent = teachers.length;
  if (refs.dashClasses) refs.dashClasses.textContent = classes.length;

  const allGrades = grades.map((g) => Number(g.value) || 0);
  const average = allGrades.length
    ? (allGrades.reduce((sum, value) => sum + value, 0) / allGrades.length).toFixed(2)
    : "0.00";

  if (refs.dashAverage) refs.dashAverage.textContent = average;

  if (!refs.dashboardChart || typeof Chart === "undefined") return;

  const labels = classes.map((c) => c.name);
  const data = classes.map((classItem) => {
    const classGrades = grades.filter((g) => g.turmaId === classItem.id);
    if (!classGrades.length) return 0;

    return Number(
      (
        classGrades.reduce((sum, item) => sum + Number(item.value || 0), 0) /
        classGrades.length
      ).toFixed(2),
    );
  });

  if (dashboardChartInstance) {
    dashboardChartInstance.destroy();
  }

  dashboardChartInstance = new Chart(refs.dashboardChart, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Média por turma",
          data,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
        },
      },
    },
  });
}

async function loadClasses() {
  const snapshot = await getDocs(query(collection(db, "turmas"), orderBy("name")));
  classes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (refs.classesList) {
    refs.classesList.innerHTML = classes.length
      ? classes
          .map(
            (item) => `
        <div class="item">
          <h4>${item.name}</h4>
          <p><strong>Turno:</strong> ${item.shift}</p>
          <p><strong>Ano letivo:</strong> ${item.year}</p>
          ${
            currentUserProfile?.role === "admin"
              ? `
              <div class="actions">
                <button class="btn-secondary" onclick="window.editClass('${item.id}')">Editar</button>
                <button class="btn-secondary" onclick="window.openClassDetail('${item.id}')">Abrir turma</button>
                <button class="btn" onclick="window.generateClassReport('${item.id}')">Gerar relatório</button>
                <button class="btn-danger" onclick="window.deleteClass('${item.id}')">Excluir</button>
              </div>
            `
              : currentUserProfile?.role === "professor"
                ? `
              <div class="actions">
                <button class="btn-secondary" onclick="window.openClassDetail('${item.id}')">Abrir turma</button>
                <button class="btn" onclick="window.generateClassReport('${item.id}')">Gerar relatório</button>
              </div>
            `
                : ""
          }
        </div>
      `,
          )
          .join("")
      : `<div class="empty">Nenhuma turma cadastrada.</div>`;
  }

  if (refs.studentClass) {
    refs.studentClass.innerHTML = classes.length
      ? `<option value="">Selecione uma turma</option>` +
        classes
          .map((item) => `<option value="${item.id}">${item.name} - ${item.shift}</option>`)
          .join("")
      : `<option value="">Nenhuma turma cadastrada</option>`;
  }
}

async function loadSubjects() {
  const snapshot = await getDocs(query(collection(db, "subjects"), orderBy("name")));
  subjects = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (refs.subjectsList) {
    refs.subjectsList.innerHTML = subjects.length
      ? subjects
          .map(
            (item) => `
        <div class="item">
          <h4>${item.name}</h4>
          <p><strong>Código:</strong> ${item.code || "-"}</p>
          ${
            currentUserProfile?.role === "admin" || currentUserProfile?.role === "professor"
              ? `
              <div class="actions">
                <button class="btn-secondary" onclick="window.editSubject('${item.id}')">Editar</button>
                <button class="btn-danger" onclick="window.deleteSubject('${item.id}')">Excluir</button>
              </div>
            `
              : ""
          }
        </div>
      `,
          )
          .join("")
      : `<div class="empty">Nenhuma disciplina cadastrada.</div>`;
  }

  if (refs.gradeSubject) {
    refs.gradeSubject.innerHTML = subjects.length
      ? `<option value="">Selecione uma disciplina</option>` +
        subjects.map((item) => `<option value="${item.id}">${item.name}</option>`).join("")
      : `<option value="">Nenhuma disciplina cadastrada</option>`;
  }
}

async function loadStudents() {
  const snapshot = await getDocs(query(collection(db, "students"), orderBy("name")));
  students = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  const visibleStudents = getVisibleStudents();
  if (refs.studentsCount) refs.studentsCount.textContent = visibleStudents.length;

  if (refs.studentsList) {
    refs.studentsList.innerHTML = visibleStudents.length
      ? visibleStudents
          .map((student) => {
            const turmaNome = student.turmaId
              ? getClassNameById(student.turmaId)
              : student.className || "Sem turma";

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
          })
          .join("")
      : `<div class="empty">Nenhum aluno disponível.</div>`;
  }

  fillStudentSelectsByRole();
}

async function loadTeachers() {
  const snapshot = await getDocs(query(collection(db, "teachers"), orderBy("name")));
  teachers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (refs.teachersCount) refs.teachersCount.textContent = teachers.length;

  if (refs.teachersList) {
    refs.teachersList.innerHTML = teachers.length
      ? teachers
          .map(
            (teacher) => `
        <div class="item">
          <h4>${teacher.name}</h4>
          <p><strong>Disciplina:</strong> ${teacher.subject || "-"}</p>
          <p><strong>Contato:</strong> ${teacher.contact || "-"}</p>
          <p><strong>E-mail:</strong> ${teacher.email || "-"}</p>
          ${
            currentUserProfile?.role === "admin"
              ? `
              <div class="actions">
                <button class="btn-secondary" onclick="window.editTeacher('${teacher.id}')">Editar</button>
                <button class="btn-danger" onclick="window.deleteTeacher('${teacher.id}')">Excluir</button>
              </div>
            `
              : ""
          }
        </div>
      `,
          )
          .join("")
      : `<div class="empty">Nenhum professor cadastrado.</div>`;
  }
}

async function loadGrades() {
  const snapshot = await getDocs(collection(db, "grades"));
  grades = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  const visibleGrades = getVisibleGrades();
  if (refs.gradesCount) refs.gradesCount.textContent = visibleGrades.length;

  if (refs.gradesList) {
    refs.gradesList.innerHTML = visibleGrades.length
      ? visibleGrades
          .map((grade) => {
            const student = students.find((s) => s.id === grade.studentId);
            const subjectName = grade.subjectId
              ? getSubjectNameById(grade.subjectId)
              : grade.subject || "Sem disciplina";

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
          })
          .join("")
      : `<div class="empty">Nenhuma nota registrada.</div>`;
  }
}

async function loadAttendance() {
  const snapshot = await getDocs(collection(db, "attendance"));
  attendance = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  const visibleAttendance = getVisibleAttendance();
  if (refs.attendanceCount) refs.attendanceCount.textContent = visibleAttendance.length;

  if (refs.attendanceList) {
    refs.attendanceList.innerHTML = visibleAttendance.length
      ? visibleAttendance
          .map((record) => {
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
          })
          .join("")
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

  const professoresBtn = document.querySelector('.tab-btn[data-tab="professores"]');
  const turmasBtn = document.querySelector('.tab-btn[data-tab="turmas"]');
  const disciplinasBtn = document.querySelector('.tab-btn[data-tab="disciplinas"]');
  const notasBtn = document.querySelector('.tab-btn[data-tab="notas"]');
  const faltasBtn = document.querySelector('.tab-btn[data-tab="faltas"]');
  const alunosBtn = document.querySelector('.tab-btn[data-tab="alunos"]');
  const usuariosBtn = document.querySelector('.tab-btn[data-tab="usuarios"]');
  const dashboardBtn = document.querySelector('.tab-btn[data-tab="dashboard"]');

  if (professoresBtn) professoresBtn.style.display = isResponsavel ? "none" : "inline-block";
  if (turmasBtn) turmasBtn.style.display = isResponsavel ? "none" : "inline-block";
  if (disciplinasBtn) disciplinasBtn.style.display = isResponsavel ? "none" : "inline-block";
  if (notasBtn) notasBtn.style.display = isResponsavel ? "none" : "inline-block";
  if (faltasBtn) faltasBtn.style.display = isResponsavel ? "none" : "inline-block";
  if (alunosBtn) alunosBtn.style.display = isResponsavel ? "none" : "inline-block";
  if (usuariosBtn) usuariosBtn.style.display = isAdmin ? "inline-block" : "none";
  if (dashboardBtn) dashboardBtn.style.display = isResponsavel ? "none" : "inline-block";

  if (refs.userBar) refs.userBar.style.display = "flex";
  if (refs.userInfoText) {
    refs.userInfoText.textContent = `Perfil: ${role} | Usuário: ${
      currentUserProfile?.name || currentFirebaseUser?.email || ""
    }`;
  }

  if (isResponsavel) {
    activateTab("relatorios");
  } else {
    activateTab(document.getElementById("dashboard") ? "dashboard" : "alunos");
  }
}

function generateStudentReport(studentId) {
  const student = students.find((s) => s.id === studentId);
  if (!student) {
    refs.reportResult.innerHTML = "<p>Aluno não encontrado.</p>";
    return;
  }

  const allowed =
    currentUserProfile?.role !== "responsavel" ||
    currentUserProfile.studentId === studentId;

  if (!allowed) {
    refs.reportResult.innerHTML = "<p>Você não tem permissão para visualizar este relatório.</p>";
    return;
  }

  const studentGrades = grades.filter((g) => g.studentId === studentId);
  const studentAttendance = attendance.filter((a) => a.studentId === studentId);

  const turmaNome = student.turmaId ? getClassNameById(student.turmaId) : "Sem turma";
  const faltas = studentAttendance.filter((a) => a.status === "Falta").length;
  const presencas = studentAttendance.filter((a) => a.status === "Presente").length;
  const totalAulas = faltas + presencas;
  const frequencia = totalAulas ? ((presencas / totalAulas) * 100).toFixed(1) : "100.0";

  const disciplinas = {};
  studentGrades.forEach((g) => {
    const nomeDisciplina = g.subjectId
      ? getSubjectNameById(g.subjectId)
      : g.subject || "Sem disciplina";

    if (!disciplinas[nomeDisciplina]) disciplinas[nomeDisciplina] = [];
    disciplinas[nomeDisciplina].push(Number(g.value || 0));
  });

  let linhas = "";
  Object.keys(disciplinas)
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .forEach((disciplina) => {
      const notas = disciplinas[disciplina];
      const media = notas.length
        ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2)
        : "0.00";

      linhas += `
        <tr>
          <td>${disciplina}</td>
          <td>${notas.join(" / ")}</td>
          <td>${media}</td>
        </tr>
      `;
    });

  refs.reportResult.innerHTML = `
    <div class="boletim-pdf">
      <div class="boletim-header">
        <img src="logo.png" alt="Logo Universo Infantil" class="report-logo" />
        <h2>Centro Educacional Universo Infantil</h2>
        <h3>Boletim Escolar</h3>
      </div>

      <div class="boletim-info">
        <div><strong>Aluno:</strong> ${student.name}</div>
        <div><strong>Turma:</strong> ${turmaNome}</div>
        <div><strong>Matrícula:</strong> ${student.registration || "-"}</div>
        <div><strong>Responsável:</strong> ${student.guardian || "-"}</div>
        <div><strong>E-mail do responsável:</strong> ${student.guardianEmail || "-"}</div>
        <div><strong>Frequência:</strong> ${frequencia}%</div>
      </div>

      <table class="boletim-table">
        <thead>
          <tr>
            <th>Disciplina</th>
            <th>Notas</th>
            <th>Média</th>
          </tr>
        </thead>
        <tbody>
          ${linhas || `<tr><td colspan="3">Sem notas cadastradas.</td></tr>`}
        </tbody>
      </table>

      <div class="boletim-resumo">
        <p><strong>Presenças:</strong> ${presencas}</p>
        <p><strong>Faltas:</strong> ${faltas}</p>
        <p><strong>Observação:</strong> ${student.observation || "Sem observações"}</p>
      </div>

      <div class="assinaturas">
        <div class="assinatura-box">
          <div class="linha-assinatura"></div>
          <p>Assinatura do Responsável</p>
        </div>

        <div class="assinatura-box">
          <div class="linha-assinatura"></div>
          <p>Assinatura do Professor</p>
        </div>
      </div>
    </div>
  `;
}

window.openClassDetail = (classId) => {
  if (currentUserProfile?.role === "responsavel") return;

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
      ? classStudents
          .map((student) => {
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
                  ? studentGrades
                      .map(
                        (grade) => `
                    <p>- ${grade.subject || getSubjectNameById(grade.subjectId)} | ${grade.term} | Nota: ${grade.value}</p>
                  `,
                      )
                      .join("")
                  : "<p>Nenhuma nota registrada.</p>"
              }
            </div>
          `;
          })
          .join("")
      : `<div class="empty">Nenhum aluno cadastrado nesta turma.</div>`;
  }

  activateTab("turmaDetalhe");
};

window.generateClassReport = (classId) => {
  if (currentUserProfile?.role === "responsavel") return;

  const turma = classes.find((item) => item.id === classId);
  if (!turma) return;

  const classStudents = students
    .filter((student) => student.turmaId === classId)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  let linhas = "";

  if (classStudents.length) {
    classStudents.forEach((student) => {
      const studentGrades = grades.filter((item) => item.studentId === student.id);
      const studentAttendance = attendance.filter((item) => item.studentId === student.id);

      const faltas = studentAttendance.filter((item) => item.status === "Falta").length;
      const presencas = studentAttendance.filter((item) => item.status === "Presente").length;
      const totalAulas = faltas + presencas;
      const frequencia = totalAulas ? ((presencas / totalAulas) * 100).toFixed(1) : "100.0";

      const media = studentGrades.length
        ? (
            studentGrades.reduce((sum, item) => sum + Number(item.value || 0), 0) /
            studentGrades.length
          ).toFixed(2)
        : "0.00";

      const disciplinasAluno = studentGrades.length
        ? studentGrades
            .map((grade) => grade.subject || getSubjectNameById(grade.subjectId))
            .filter((v, i, arr) => arr.indexOf(v) === i)
            .sort((a, b) => a.localeCompare(b, "pt-BR"))
            .join(", ")
        : "-";

      linhas += `
        <tr>
          <td>${student.name}</td>
          <td>${student.registration || "-"}</td>
          <td>${disciplinasAluno}</td>
          <td>${media}</td>
          <td>${presencas}</td>
          <td>${faltas}</td>
          <td>${frequencia}%</td>
        </tr>
      `;
    });
  }

  refs.classReportResult.innerHTML = `
    <div class="relatorio-turma-pdf">
      <div class="boletim-header">
        <img src="logo.png" alt="Logo Universo Infantil" class="report-logo" />
        <h2>Centro Educacional Universo Infantil</h2>
        <h3>Relatório da Turma</h3>
      </div>

      <div class="boletim-info">
        <div><strong>Turma:</strong> ${turma.name}</div>
        <div><strong>Turno:</strong> ${turma.shift}</div>
        <div><strong>Ano letivo:</strong> ${turma.year}</div>
        <div><strong>Total de alunos:</strong> ${classStudents.length}</div>
      </div>

      <table class="boletim-table">
        <thead>
          <tr>
            <th>Aluno</th>
            <th>Matrícula</th>
            <th>Disciplinas</th>
            <th>Média</th>
            <th>Presenças</th>
            <th>Faltas</th>
            <th>Frequência</th>
          </tr>
        </thead>
        <tbody>
          ${linhas || `<tr><td colspan="7">Nenhum aluno cadastrado nesta turma.</td></tr>`}
        </tbody>
      </table>

      <div class="assinaturas">
        <div class="assinatura-box">
          <div class="linha-assinatura"></div>
          <p>Assinatura do Professor</p>
        </div>

        <div class="assinatura-box">
          <div class="linha-assinatura"></div>
          <p>Assinatura da Coordenação</p>
        </div>
      </div>
    </div>
  `;

  activateTab("turmaDetalhe");
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

  const btn = refs.studentForm?.querySelector('button[type="submit"]');
  if (btn) btn.textContent = "Atualizar aluno";

  activateTab("alunos");
};

window.editTeacher = (id) => {
  const teacher = teachers.find((item) => item.id === id);
  if (!teacher) return;

  editingTeacherId = id;

  document.getElementById("teacherName").value = teacher.name || "";
  document.getElementById("teacherSubject").value = teacher.subject || "";
  document.getElementById("teacherContact").value = teacher.contact || "";

  const btn = refs.teacherForm?.querySelector('button[type="submit"]');
  if (btn) btn.textContent = "Atualizar dados do professor";

  activateTab("professores");
};

window.editSubject = (id) => {
  const subject = subjects.find((item) => item.id === id);
  if (!subject) return;

  editingSubjectId = id;

  document.getElementById("subjectName").value = subject.name || "";
  document.getElementById("subjectCode").value = subject.code || "";

  const btn = refs.subjectForm?.querySelector('button[type="submit"]');
  if (btn) btn.textContent = "Atualizar disciplina";

  activateTab("disciplinas");
};

window.editClass = (id) => {
  const classItem = classes.find((item) => item.id === id);
  if (!classItem) return;

  editingClassId = id;

  document.getElementById("className").value = classItem.name || "";
  document.getElementById("classShift").value = classItem.shift || "Manhã";
  document.getElementById("classYear").value = classItem.year || "";

  const btn = refs.classForm?.querySelector('button[type="submit"]');
  if (btn) btn.textContent = "Atualizar turma";

  activateTab("turmas");
};

refs.forgotPasswordBtn?.addEventListener("click", async () => {
  const email = refs.loginEmail.value.trim();

  if (!email) {
    showStatus(refs.loginStatus, "Digite seu e-mail para recuperar a senha.", "error");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showStatus(
      refs.loginStatus,
      "Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.",
      "success",
    );
  } catch (error) {
    console.error(error);
    showStatus(refs.loginStatus, "Não foi possível enviar o e-mail de recuperação.", "error");
  }
});

refs.loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const email = refs.loginEmail.value.trim();
    const password = refs.loginPassword.value;
    const selectedRole = refs.loginRole.value;

    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profile = await getUserProfileByUid(cred.user.uid);

    if (!profile) {
      showStatus(refs.loginStatus, "Usuário sem perfil cadastrado.", "error");
      await signOut(auth);
      return;
    }

    if ((profile.role || "").toLowerCase() !== selectedRole.toLowerCase()) {
      showStatus(refs.loginStatus, "Perfil incorreto.", "error");
      await signOut(auth);
      return;
    }

    currentFirebaseUser = cred.user;
    currentUserProfile = profile;

    refs.loginOverlay.style.display = "none";
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
    const payload = {
      name: document.getElementById("className").value,
      shift: document.getElementById("classShift").value,
      year: Number(document.getElementById("classYear").value),
      teacherId: "",
    };

    if (editingClassId) {
      await updateDoc(doc(db, "turmas", editingClassId), payload);
      showStatus(refs.classStatus, "Turma atualizada com sucesso.");
      editingClassId = null;
      resetClassFormButton();
    } else {
      await addDoc(collection(db, "turmas"), {
        ...payload,
        createdAt: new Date().toISOString(),
      });
      showStatus(refs.classStatus, "Turma salva com sucesso.");
    }

    refs.classForm.reset();
    await loadClasses();
  } catch (error) {
    console.error(error);
    showStatus(refs.classStatus, "Erro ao salvar turma.", "error");
  }
});

refs.subjectForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const payload = {
      name: document.getElementById("subjectName").value,
      code: document.getElementById("subjectCode").value,
    };

    if (editingSubjectId) {
      await updateDoc(doc(db, "subjects", editingSubjectId), payload);
      showStatus(refs.subjectStatus, "Disciplina atualizada com sucesso.");
      editingSubjectId = null;
      resetSubjectFormButton();
    } else {
      await addDoc(collection(db, "subjects"), {
        ...payload,
        createdAt: new Date().toISOString(),
      });
      showStatus(refs.subjectStatus, "Disciplina salva com sucesso.");
    }

    refs.subjectForm.reset();
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
      guardianEmail: document.getElementById("studentGuardianEmail").value.trim(),
      observation: document.getElementById("studentObservation").value,
    };

    if (editingStudentId) {
      await updateDoc(doc(db, "students", editingStudentId), studentData);
      showStatus(refs.studentStatus, "Aluno atualizado com sucesso.");
      editingStudentId = null;
      resetStudentFormButton();
    } else {
      await addDoc(collection(db, "students"), {
        ...studentData,
        createdAt: new Date().toISOString(),
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
    const payload = {
      name: document.getElementById("teacherName").value,
      subject: document.getElementById("teacherSubject").value,
      contact: document.getElementById("teacherContact").value,
    };

    if (editingTeacherId) {
      await updateDoc(doc(db, "teachers", editingTeacherId), payload);
      showStatus(refs.teacherStatus, "Dados do professor atualizados com sucesso.");
      editingTeacherId = null;
      resetTeacherFormButton();
    } else {
      await addDoc(collection(db, "teachers"), {
        ...payload,
        email: "",
        uid: "",
        createdAt: new Date().toISOString(),
      });
      showStatus(refs.teacherStatus, "Dados do professor salvos com sucesso.");
    }

    refs.teacherForm.reset();
    await loadTeachers();
  } catch (error) {
    console.error(error);
    showStatus(refs.teacherStatus, "Erro ao salvar dados do professor.", "error");
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
      createdAt: new Date().toISOString(),
    });

    refs.gradeForm.reset();
    showStatus(refs.gradeStatusMsg, "Nota salva com sucesso.");
    await loadGrades();
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
      createdAt: new Date().toISOString(),
    });

    refs.attendanceForm.reset();
    showStatus(refs.attendanceStatusMsg, "Presença salva com sucesso.");
    await loadAttendance();
  } catch (error) {
    console.error(error);
    showStatus(refs.attendanceStatusMsg, "Erro ao salvar presença.", "error");
  }
});

refs.userForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const email = document.getElementById("userEmail").value.trim();
    const password = document.getElementById("userPassword").value;
    const name = document.getElementById("userName").value;
    const role = document.getElementById("userRole").value;
    const studentId = document.getElementById("userStudent").value || null;

    const adminEmail = currentFirebaseUser?.email || refs.loginEmail.value.trim();
    const adminPassword = refs.loginPassword.value;

    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", cred.user.uid), {
      name,
      email,
      role,
      studentId: role === "responsavel" ? studentId : null,
    });

    if (role === "professor") {
      const teacherExists = teachers.some((t) => t.email === email || t.uid === cred.user.uid);
      if (!teacherExists) {
        await addDoc(collection(db, "teachers"), {
          name,
          subject: "",
          contact: "",
          email,
          uid: cred.user.uid,
          createdAt: new Date().toISOString(),
        });
      }
    }

    await signOut(auth);

    refs.userForm.reset();
    alert("Usuário criado com sucesso. Faça login novamente como administrador.");

    if (adminEmail && adminPassword) {
      refs.loginOverlay.style.display = "flex";
      refs.loginEmail.value = adminEmail;
      refs.loginPassword.value = adminPassword;
      refs.loginRole.value = "admin";
    }
  } catch (error) {
    console.error(error);
    alert("Erro ao criar usuário: " + error.message);
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

window.deleteSubject = async (id) => {
  if (!(currentUserProfile?.role === "admin" || currentUserProfile?.role === "professor")) return;
  if (!confirm("Deseja excluir esta disciplina?")) return;

  await deleteDoc(doc(db, "subjects", id));
  await loadSubjects();
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

window.deleteClass = async (id) => {
  if (currentUserProfile?.role !== "admin") return;
  if (!confirm("Deseja excluir esta turma?")) return;

  await deleteDoc(doc(db, "turmas", id));
  await loadClasses();
};

async function initData() {
  await Promise.all([
    loadClasses(),
    loadSubjects(),
    loadStudents(),
    loadTeachers(),
    loadGrades(),
    loadAttendance(),
  ]);

  loadDashboard();

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
  refs.loginOverlay.style.display = "none";
  applyPermissions();
  await initData();
});