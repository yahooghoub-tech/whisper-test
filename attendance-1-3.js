
const API_URL = "https://berandil.ir/farakhan-api/attendance.php";

const className = "اول-3";

const students = [
    { name: "مهربد بلند همت", className },
    { name: "علیسان جهانی", className },
    { name: "سامیار سلیمی", className },
    { name: "لیام شریفی", className },
    { name: "آرشا شریفی", className },
    { name: "عرفان علیزاده", className },
    { name: "رها علیزاده", className },
    { name: "رادین عموحسن", className },
    { name: "سپهراد مرادی", className },
    { name: "آدرین نجارزاده", className },
    { name: "کیاراد هوشی", className },
    { name: "یزدان یوسفی", className }
];

const studentsContainer = document.getElementById("studentsContainer");
const totalCount = document.getElementById("totalCount");
const presentCount = document.getElementById("presentCount");
const absentCount = document.getElementById("absentCount");
const todayDate = document.getElementById("todayDate");
const message = document.getElementById("message");

let currentAttendanceDay = getToday();
let isLoadingAttendance = false;
let messageTimer = null;

const studentButtons = new Map();

function getToday() {
    const d = new Date();

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function showDate() {
    todayDate.textContent = new Date().toLocaleDateString("fa-IR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function showMessage(text) {
    message.textContent = text;
    message.classList.add("show");

    clearTimeout(messageTimer);

    messageTimer = setTimeout(() => {
        message.classList.remove("show");
    }, 2500);
}

async function apiRequest(method, params = {}, body = null) {
    const url = new URL(API_URL);

    if (method === "GET") {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
    }

    const options = {
        method,
        headers: {
            Accept: "application/json"
        }
    };

    if (method === "POST") {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error("پاسخ سرور معتبر نیست.");
    }

    if (!response.ok || !result.success) {
        throw new Error(result.message || "ارتباط با سرور ناموفق بود.");
    }

    return result;
}

function createStudents() {
    studentsContainer.innerHTML = "";
    studentButtons.clear();

    students.forEach(student => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "student-button present";
        button.dataset.name = student.name;

        const nameSpan = document.createElement("span");
        nameSpan.className = "student-name";
        nameSpan.textContent = student.name;

        const statusSpan = document.createElement("span");
        statusSpan.className = "student-status";
        statusSpan.textContent = "حاضر";

        button.append(nameSpan, statusSpan);

        button.addEventListener("click", () => {
            toggleAttendance(student, button);
        });

        studentsContainer.appendChild(button);
        studentButtons.set(student.name, button);
    });

    totalCount.textContent = students.length;
    updateCounts();
}

function findButton(name) {
    return studentButtons.get(name) || null;
}

function setButtonAbsent(button) {
    button.classList.remove("present");
    button.classList.add("absent");

    const status = button.querySelector(".student-status");

    if (status) {
        status.textContent = "غایب";
    }
}

function setButtonPresent(button) {
    button.classList.remove("absent");
    button.classList.add("present");

    const status = button.querySelector(".student-status");

    if (status) {
        status.textContent = "حاضر";
    }
}

function applyRecord(record) {
    const button = findButton(record.student_name);

    if (!button || button.dataset.processing === "true") {
        return;
    }

    if (record.status === "غایب") {
        setButtonAbsent(button);
    } else if (record.status === "حاضر") {
        setButtonPresent(button);
    }
}

async function loadTodayAttendance(options = {}) {
    if (isLoadingAttendance) {
        return;
    }

    isLoadingAttendance = true;

    try {
        const today = getToday();

        const result = await apiRequest("GET", {
            class_name: className,
            date: today
        });

        // اگر روز در حین دریافت اطلاعات تغییر کرده باشد،
        // نتیجه مربوط به روز قبلی اعمال نمی‌شود.
        if (today !== getToday()) {
            return;
        }

        const records = Array.isArray(result.data)
            ? result.data
            : [];

        // ابتدا وضعیت پیش‌فرض همه دانش‌آموزان حاضر می‌شود.
        students.forEach(student => {
            const button = findButton(student.name);

            if (!button || button.dataset.processing === "true") {
                return;
            }

            setButtonPresent(button);
        });

        // سپس وضعیت ذخیره‌شده روی هاست اعمال می‌شود.
        records.forEach(record => {
            if (
                record.class_name === className &&
                record.attendance_date === today
            ) {
                applyRecord(record);
            }
        });

        updateCounts();

        if (options.showSuccess) {
            showMessage("اطلاعات حضور و غیاب به‌روز شد.");
        }
    } catch (error) {
        console.error("خطا در دریافت حضور و غیاب:", error);

        if (options.showError) {
            showMessage("❌ دریافت اطلاعات از هاست ناموفق بود.");
        }
    } finally {
        isLoadingAttendance = false;
    }
}

async function toggleAttendance(student, button) {
    if (button.disabled || button.dataset.processing === "true") {
        return;
    }

    const previousStatus = button.classList.contains("absent")
        ? "غایب"
        : "حاضر";

    const newStatus = previousStatus === "غایب"
        ? "حاضر"
        : "غایب";

    const today = getToday();

    button.dataset.processing = "true";
    button.disabled = true;

    try {
        await apiRequest("POST", {}, {
            student_name: student.name,
            class_name: student.className,
            status: newStatus,
            attendance_date: today
        });

        // اگر روز تغییر کرده باشد، ثبت روز قبل را
        // به‌عنوان وضعیت روز جدید نمایش نمی‌دهیم.
        if (today !== getToday()) {
            showMessage("تاریخ تغییر کرده است؛ اطلاعات دوباره بررسی می‌شود.");
            return;
        }

        if (newStatus === "غایب") {
            setButtonAbsent(button);
            showMessage(`⚫ ${student.name} غایب شد`);
        } else {
            setButtonPresent(button);
            showMessage(`🟢 ${student.name} حاضر شد`);
        }

    } catch (error) {
        console.error("خطا در ثبت حضور و غیاب:", error);

        // در صورت خطا، وضعیت قبلی حفظ می‌شود.
        if (previousStatus === "غایب") {
            setButtonAbsent(button);
        } else {
            setButtonPresent(button);
        }

        showMessage("❌ ثبت وضعیت انجام نشد؛ اتصال هاست را بررسی کنید.");
    } finally {
        delete button.dataset.processing;
        button.disabled = false;
        updateCounts();

        // پس از ثبت، وضعیت نهایی را از سرور بررسی می‌کنیم.
        loadTodayAttendance();
    }
}

function updateCounts() {
    const absent = students.filter(student => {
        const button = findButton(student.name);
        return button && button.classList.contains("absent");
    }).length;

    const present = students.length - absent;

    totalCount.textContent = students.length;
    absentCount.textContent = absent;
    presentCount.textContent = present;
}

function checkAttendanceDayChange() {
    const newDay = getToday();

    if (newDay === currentAttendanceDay) {
        return;
    }

    console.log(
        "روز جدید حضور و غیاب:",
        currentAttendanceDay,
        "→",
        newDay
    );

    currentAttendanceDay = newDay;

    showDate();
    createStudents();
    loadTodayAttendance({ showError: true });
}

// دریافت اولیه اطلاعات
showDate();
createStudents();
loadTodayAttendance({ showError: true });

// بررسی تغییرات ثبت‌شده روی هاست هر ۵ ثانیه
setInterval(() => {
    checkAttendanceDayChange();
    loadTodayAttendance();
}, 5000);

// همگام‌سازی پس از بازگشت به صفحه
window.addEventListener("focus", () => {
    checkAttendanceDayChange();
    loadTodayAttendance({ showError: true });
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        checkAttendanceDayChange();
        loadTodayAttendance({ showError: true });
    }
});
