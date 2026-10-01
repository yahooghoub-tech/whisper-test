const SUPABASE_URL = "https://ghnpiijihybuhfetnxjp.supabase.co";
const SUPABASE_KEY = "sb_publishable_SEGca8-w1pAO3_TQgMd-qA_vOvkj6jq";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

/* =========================
   تنظیمات اصلی
========================= */

const SCHOOL_LAT = 35.76494314018861;
const SCHOOL_LNG = 51.32257158390593;

// شعاع مجاز: 50 متر
const ALLOWED_RADIUS = 50;

/*
   شعاع زمین برای محاسبه فاصله
*/
const EARTH_RADIUS = 6371000;

/* =========================
   متغیرهای عمومی
========================= */

let currentStudentName = "";
let currentClassName = "";

let parentCallChannel = null;
let parentRefreshInterval = null;

let mapInstance = null;
let schoolMarker = null;
let parentMarker = null;
let schoolCircle = null;
let parentSchoolLine = null;
let distanceLabel = null;
let accuracyCircle = null;

let leafletReadyPromise = null;

/* =========================
   DOM
========================= */

const loginScreen = document.getElementById("loginScreen");
const parentPanel = document.getElementById("parentPanel");

const studentNameInput = document.getElementById("studentName");
const parentCodeInput = document.getElementById("parentCode");

const loginButton = document.getElementById("loginButton");
const message = document.getElementById("message");

const panelStudentName = document.getElementById("panelStudentName");
const panelClassName = document.getElementById("panelClassName");

const currentDate = document.getElementById("currentDate");
const currentTime = document.getElementById("currentTime");

const callActivationTime =
    document.getElementById("callActivationTime");

const callDescription =
    document.getElementById("callDescription");

const callButton =
    document.getElementById("callButton");

const locationStatus =
    document.getElementById("locationStatus");

/* =========================
   زمان فراخوان کلاس‌ها
========================= */

const callSchedules = {
    "1": {
        start: "12:00",
        end: "14:00"
    },
    "2": {
        start: "12:00",
        end: "14:00"
    },
    "3": {
        start: "12:00",
        end: "14:00"
    },
    "4": {
        start: "12:00",
        end: "14:00"
    },
    "5": {
        start: "12:00",
        end: "14:00"
    },
    "6": {
        start: "12:00",
        end: "14:00"
    },
    "7": {
        start: "12:00",
        end: "14:00"
    },
    "8": {
        start: "12:00",
        end: "14:00"
    },
    "9": {
        start: "12:00",
        end: "14:00"
    },
    "10": {
        start: "12:00",
        end: "14:00"
    },
    "11": {
        start: "12:00",
        end: "14:00"
    },
    "12": {
        start: "12:00",
        end: "14:00"
    },
    "13": {
        start: "12:00",
        end: "14:00"
    },
    "14": {
        start: "12:00",
        end: "14:00"
    }
};

/* =========================
   توابع عمومی
========================= */

function showMessage(text, type = "") {
    if (!message) return;

    message.textContent = text;
    message.className = "message";

    if (type) {
        message.classList.add(type);
    }
}

function normalizeClassName(className) {
    if (!className) return "";

    return String(className)
        .replace("کلاس", "")
        .trim();
}

function getClassSchedule(className) {
    const normalized = normalizeClassName(className);

    if (callSchedules[normalized]) {
        return callSchedules[normalized];
    }

    const numberMatch = normalized.match(/\d+/);

    if (numberMatch) {
        return callSchedules[numberMatch[0]] || null;
    }

    return null;
}

/* =========================
   تاریخ و ساعت ایران
========================= */

function getIranDate() {
    return new Date(
        new Date().toLocaleString("en-US", {
            timeZone: "Asia/Tehran"
        })
    );
}

function getIranTimeString() {
    const date = getIranDate();

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
}

function getIranDateString() {
    const date = getIranDate();

    return date.toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });
}

function getIranDateForDatabase() {
    const date = getIranDate();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function updateDateTime() {
    if (currentDate) {
        currentDate.textContent = getIranDateString();
    }

    if (currentTime) {
        currentTime.textContent = getIranTimeString();
    }
}

setInterval(updateDateTime, 1000);
updateDateTime();

/* =========================
   بررسی زمان فعال بودن فراخوان
========================= */

function isCallTimeActive(className) {
    const schedule = getClassSchedule(className);

    if (!schedule) {
        return false;
    }

    const now = getIranDate();

    const currentMinutes =
        now.getHours() * 60 + now.getMinutes();

    const [startHour, startMinute] =
        schedule.start.split(":").map(Number);

    const [endHour, endMinute] =
        schedule.end.split(":").map(Number);

    const startMinutes =
        startHour * 60 + startMinute;

    const endMinutes =
        endHour * 60 + endMinute;

    return (
        currentMinutes >= startMinutes &&
        currentMinutes <= endMinutes
    );
}

function updateCallScheduleUI() {
    if (!currentClassName) return;

    const schedule =
        getClassSchedule(currentClassName);

    if (!schedule) {
        if (callActivationTime) {
            callActivationTime.textContent =
                "زمان مشخص نشده";
        }

        if (callDescription) {
            callDescription.textContent =
                "زمان فراخوان این کلاس مشخص نشده است.";
        }

        if (callButton) {
            callButton.disabled = true;
        }

        return;
    }

    if (callActivationTime) {
        callActivationTime.textContent =
            `${schedule.start} تا ${schedule.end}`;
    }

    const active =
        isCallTimeActive(currentClassName);

    if (active) {
        if (callDescription) {
            callDescription.textContent =
                "اکنون زمان فعال بودن فراخوان است.";
        }

        if (callButton && !callButton.dataset.called) {
            callButton.disabled = false;
        }
    } else {
        if (callDescription) {
            callDescription.textContent =
                `زمان فعال بودن فراخوان: ${schedule.start} تا ${schedule.end}`;
        }

        if (callButton && !callButton.dataset.called) {
            callButton.disabled = true;
        }
    }
}

setInterval(updateCallScheduleUI, 10000);

/* =========================
   محاسبه فاصله
========================= */

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {
    const dLat =
        (lat2 - lat1) * Math.PI / 180;

    const dLon =
        (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    const c =
        2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return EARTH_RADIUS * c;
}

function formatDistance(distance) {
    if (!Number.isFinite(distance)) {
        return "---";
    }

    if (distance < 1000) {
        return `${Math.round(distance).toLocaleString("fa-IR")} متر`;
    }

    return `${(distance / 1000)
        .toFixed(2)
        .toLocaleString("fa-IR")} کیلومتر`;
}
/* =========================
   بارگذاری Leaflet
========================= */

function loadLeaflet() {
    if (
        window.L &&
        typeof window.L.map === "function"
    ) {
        return Promise.resolve();
    }

    if (leafletReadyPromise) {
        return leafletReadyPromise;
    }

    leafletReadyPromise = new Promise(
        (resolve, reject) => {

            const existingCss =
                document.querySelector(
                    'link[href*="leaflet"]'
                );

            if (!existingCss) {
                const css =
                    document.createElement("link");

                css.rel = "stylesheet";

                css.href =
                    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

                document.head.appendChild(css);
            }

            const existingScript =
                document.querySelector(
                    'script[src*="leaflet"]'
                );

            if (existingScript) {
                existingScript.addEventListener(
                    "load",
                    () => resolve()
                );

                existingScript.addEventListener(
                    "error",
                    () =>
                        reject(
                            new Error(
                                "Leaflet load error"
                            )
                        )
                );

                return;
            }

            const script =
                document.createElement("script");

            script.src =
                "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

            script.onload = () => resolve();

            script.onerror = () =>
                reject(
                    new Error(
                        "Leaflet load error"
                    )
                );

            document.head.appendChild(script);
        }
    );

    return leafletReadyPromise;
}

/* =========================
   ساخت کارت نقشه
========================= */

function createLocationMapCard() {
    if (
        document.getElementById(
            "locationMapCard"
        )
    ) {
        return;
    }

    const callSection =
        document.querySelector(
            ".call-section"
        );

    if (!callSection) return;

    const card =
        document.createElement("section");

    card.id = "locationMapCard";

    card.innerHTML = `
        <div style="
            margin-top:25px;
            background:rgba(255,255,255,.96);
            border-radius:18px;
            padding:18px;
            box-shadow:0 8px 30px rgba(0,0,0,.12);
            direction:rtl;
        ">

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:10px;
                margin-bottom:12px;
            ">

                <div>
                    <h2 style="
                        margin:0 0 5px 0;
                        font-size:19px;
                    ">
                        🗺️ نقشه موقعیت
                    </h2>

                    <div style="
                        font-size:13px;
                        color:#666;
                    ">
                        موقعیت مدرسه و فاصله والد
                    </div>
                </div>

                <button
                    id="mapToggleButton"
                    type="button"
                    style="
                        border:0;
                        border-radius:10px;
                        padding:8px 12px;
                        cursor:pointer;
                        background:#eee;
                        font-family:inherit;
                    "
                >
                    مخفی کردن
                </button>
            </div>

            <div
                id="locationMapContent"
            >

                <div
                    id="mapLocationStatus"
                    style="
                        padding:10px;
                        border-radius:10px;
                        background:#f3f4f6;
                        margin-bottom:10px;
                        text-align:center;
                        font-weight:bold;
                        font-size:14px;
                    "
                >
                    📍 موقعیت والد هنوز دریافت نشده است
                </div>

                <div style="
                    display:flex;
                    flex-wrap:wrap;
                    gap:8px;
                    margin-bottom:10px;
                    font-size:12px;
                ">

                    <span style="
                        background:#f3f4f6;
                        padding:6px 10px;
                        border-radius:8px;
                    ">
                        🏫 مدرسه
                    </span>

                    <span style="
                        background:#f3f4f6;
                        padding:6px 10px;
                        border-radius:8px;
                    ">
                        📍 والد
                    </span>

                    <span style="
                        background:#f3f4f6;
                        padding:6px 10px;
                        border-radius:8px;
                    ">
                        ━ فاصله مستقیم
                    </span>

                    <span style="
                        background:#f3f4f6;
                        padding:6px 10px;
                        border-radius:8px;
                    ">
                        ⭕ شعاع مجاز ۵۰ متر
                    </span>

                </div>

                <div
                    id="locationMap"
                    style="
                        width:100%;
                        height:380px;
                        min-height:300px;
                        border-radius:15px;
                        overflow:hidden;
                        background:#e5e7eb;
                    "
                ></div>

                <button
                    id="mapLocationButton"
                    type="button"
                    style="
                        width:100%;
                        margin-top:12px;
                        border:0;
                        border-radius:12px;
                        padding:13px;
                        cursor:pointer;
                        background:#2563eb;
                        color:white;
                        font-family:inherit;
                        font-size:15px;
                        font-weight:bold;
                    "
                >
                    📍 بررسی موقعیت من
                </button>

            </div>
        </div>
    `;

    callSection.parentNode.insertBefore(
        card,
        callSection
    );

    const toggleButton =
        document.getElementById(
            "mapToggleButton"
        );

    const mapContent =
        document.getElementById(
            "locationMapContent"
        );

    toggleButton.addEventListener(
        "click",
        () => {

            const hidden =
                mapContent.style.display ===
                "none";

            if (hidden) {
                mapContent.style.display =
                    "block";

                toggleButton.textContent =
                    "مخفی کردن";

                setTimeout(() => {
                    if (mapInstance) {
                        mapInstance.invalidateSize();
                    }
                }, 200);

            } else {
                mapContent.style.display =
                    "none";

                toggleButton.textContent =
                    "نمایش نقشه";
            }
        }
    );

    document
        .getElementById(
            "mapLocationButton"
        )
        .addEventListener(
            "click",
            checkParentLocation
        );
}

/* =========================
   وضعیت نقشه
========================= */

function setMapStatus(
    text,
    type = "normal"
) {
    const element =
        document.getElementById(
            "mapLocationStatus"
        );

    if (!element) return;

    element.textContent = text;

    if (type === "inside") {
        element.style.background =
            "#dcfce7";

        element.style.color =
            "#166534";
    } else if (type === "outside") {
        element.style.background =
            "#fee2e2";

        element.style.color =
            "#991b1b";
    } else {
        element.style.background =
            "#f3f4f6";

        element.style.color =
            "#374151";
    }
}

/* =========================
   ساخت نقشه
========================= */

async function initializeLocationMap() {
    createLocationMapCard();

    try {
        await loadLeaflet();

        if (!window.L) {
            throw new Error(
                "Leaflet unavailable"
            );
        }

        const mapElement =
            document.getElementById(
                "locationMap"
            );

        if (!mapElement) return;

        if (mapInstance) {
            setTimeout(() => {
                mapInstance.invalidateSize();
            }, 200);

            return;
        }

        mapInstance =
            L.map(
                "locationMap",
                {
                    zoomControl: true
                }
            );

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,
                attribution:
                    "&copy; OpenStreetMap contributors"
            }
        ).addTo(mapInstance);

        const schoolLatLng = [
            SCHOOL_LAT,
            SCHOOL_LNG
        ];

        schoolMarker =
            L.marker(
                schoolLatLng
            )
                .addTo(mapInstance)
                .bindPopup(`
                    <div style="
                        text-align:center;
                        direction:rtl;
                    ">
                        <strong>🏫 مدرسه</strong><br>
                        محل مدرسه
                    </div>
                `);

        schoolCircle =
            L.circle(
                schoolLatLng,
                {
                    radius:
                        ALLOWED_RADIUS,

                    weight: 2,

                    fillOpacity: 0.12
                }
            ).addTo(mapInstance);

        mapInstance.fitBounds(
            schoolCircle.getBounds(),
            {
                padding: [30, 30]
            }
        );

        setTimeout(() => {
            mapInstance.invalidateSize();
        }, 300);

    } catch (error) {

        console.error(
            "Map initialization error:",
            error
        );

        setMapStatus(
            "نقشه آنلاین بارگذاری نشد.",
            "normal"
        );
    }
}

/* =========================
   درخواست دسترسی موقعیت در Median
========================= */

function isMedianAndroid() {
    return (
        !!(
            window.median &&
            window.median.android
        ) ||
        /MedianAndroid|GoNativeAndroid/i.test(
            navigator.userAgent
        )
    );
}

function waitForMedianBridge(
    timeout = 3000
) {
    return new Promise(resolve => {

        if (
            window.median &&
            window.median.android
        ) {
            resolve(true);
            return;
        }

        const start =
            Date.now();

        const timer =
            setInterval(() => {

                if (
                    window.median &&
                    window.median.android
                ) {
                    clearInterval(timer);
                    resolve(true);
                    return;
                }

                if (
                    Date.now() - start >=
                    timeout
                ) {
                    clearInterval(timer);
                    resolve(false);
                }

            }, 100);
    });
}

async function requestMedianLocationPermission() {

    if (!isMedianAndroid()) {
        return;
    }

    try {

        const bridgeReady =
            await waitForMedianBridge();

        if (
            bridgeReady &&
            window.median &&
            window.median.android &&
            window.median.android.geoLocation &&
            typeof window.median.android.geoLocation
                .promptLocationServices ===
                "function"
        ) {

            window.median.android.geoLocation
                .promptLocationServices();

            await new Promise(resolve =>
                setTimeout(resolve, 700)
            );
        }

    } catch (error) {

        console.warn(
            "Median location permission error:",
            error
        );
    }
}

/* =========================
   دریافت موقعیت والد
========================= */

function getParentLocation() {

    return new Promise(
        async (resolve, reject) => {

            if (
                !navigator.geolocation
            ) {
                reject({
                    code: 0,
                    message:
                        "مرورگر از موقعیت مکانی پشتیبانی نمی‌کند."
                });

                return;
            }

            await requestMedianLocationPermission();

            navigator.geolocation
                .getCurrentPosition(
                    resolve,
                    reject,
                    {
                        enableHighAccuracy:
                            true,

                        timeout:
                            15000,

                        maximumAge:
                            0
                    }
                );
        }
    );
}
/* =========================
   نمایش موقعیت والد روی نقشه
========================= */

function updateMapWithParentLocation(
    lat,
    lng,
    distance,
    accuracy = null
) {
    if (
        !mapInstance ||
        !window.L
    ) {
        return;
    }

    const parentLatLng = [
        lat,
        lng
    ];

    const schoolLatLng = [
        SCHOOL_LAT,
        SCHOOL_LNG
    ];

    /* حذف marker قبلی والد */

    if (parentMarker) {
        mapInstance.removeLayer(
            parentMarker
        );
    }

    /* حذف دقت GPS قبلی */

    if (accuracyCircle) {
        mapInstance.removeLayer(
            accuracyCircle
        );
    }

    /* حذف خط قبلی */

    if (parentSchoolLine) {
        mapInstance.removeLayer(
            parentSchoolLine
        );
    }

    /* حذف برچسب فاصله قبلی */

    if (distanceLabel) {
        mapInstance.removeLayer(
            distanceLabel
        );
    }

    /* =========================
       Marker والد
    ========================= */

    parentMarker =
        L.marker(
            parentLatLng
        )
            .addTo(mapInstance)
            .bindPopup(`
                <div style="
                    text-align:center;
                    direction:rtl;
                    min-width:150px;
                ">
                    <strong>📍 موقعیت والد</strong>
                    <br>
                    <span>
                        فاصله تا مدرسه:
                    </span>
                    <br>
                    <strong>
                        ${formatDistance(distance)}
                    </strong>
                </div>
            `);

    /* =========================
       دایره دقت GPS
    ========================= */

    if (
        Number.isFinite(accuracy) &&
        accuracy > 0
    ) {
        accuracyCircle =
            L.circle(
                parentLatLng,
                {
                    radius: accuracy,
                    weight: 1,
                    fillOpacity: 0.08
                }
            ).addTo(mapInstance);
    }

    /* =========================
       خط مستقیم مدرسه تا والد
    ========================= */

    parentSchoolLine =
        L.polyline(
            [
                schoolLatLng,
                parentLatLng
            ],
            {
                weight: 4,
                opacity: 0.9,
                dashArray: "8, 8"
            }
        ).addTo(mapInstance);

    /* =========================
       نمایش فاصله روی خط
    ========================= */

    const middleLat =
        (
            SCHOOL_LAT + lat
        ) / 2;

    const middleLng =
        (
            SCHOOL_LNG + lng
        ) / 2;

    distanceLabel =
        L.marker(
            [
                middleLat,
                middleLng
            ],
            {
                interactive: false,

                icon:
                    L.divIcon({
                        className:
                            "distance-label",

                        html: `
                            <div style="
                                background:white;
                                padding:6px 10px;
                                border-radius:8px;
                                box-shadow:0 2px 8px rgba(0,0,0,.25);
                                font-weight:bold;
                                font-size:13px;
                                direction:rtl;
                                white-space:nowrap;
                                border:1px solid #ddd;
                                text-align:center;
                            ">
                                📏
                                ${formatDistance(distance)}
                            </div>
                        `,

                        iconSize:
                            null
                    })
            }
        ).addTo(mapInstance);

    /* =========================
       بررسی محدوده
    ========================= */

    const inside =
        distance <= ALLOWED_RADIUS;

    if (inside) {

        setMapStatus(
            `✅ داخل محدوده مجاز — فاصله: ${formatDistance(distance)}`,
            "inside"
        );

        if (locationStatus) {
            locationStatus.textContent =
                "داخل محدوده مجاز";

            locationStatus.style.color =
                "#16a34a";
        }

    } else {

        setMapStatus(
            `❌ خارج از محدوده مجاز — فاصله: ${formatDistance(distance)}`,
            "outside"
        );

        if (locationStatus) {
            locationStatus.textContent =
                "خارج از محدوده مجاز";

            locationStatus.style.color =
                "#dc2626";
        }
    }

    /* =========================
       نمایش مدرسه و والد
       همزمان روی صفحه
    ========================= */

    const bounds =
        L.latLngBounds([
            schoolLatLng,
            parentLatLng
        ]);

    mapInstance.fitBounds(
        bounds,
        {
            padding: [
                50,
                50
            ]
        }
    );

    setTimeout(() => {
        mapInstance.invalidateSize();
    }, 300);
}

/* =========================
   بررسی موقعیت والد
========================= */

async function checkParentLocation() {

    const button =
        document.getElementById(
            "mapLocationButton"
        );

    if (button) {
        button.disabled = true;

        button.textContent =
            "📍 در حال دریافت موقعیت...";
    }

    setMapStatus(
        "📍 در حال دریافت موقعیت دقیق والد...",
        "normal"
    );

    try {

        const position =
            await getParentLocation();

        const lat =
            position.coords.latitude;

        const lng =
            position.coords.longitude;

        const accuracy =
            position.coords.accuracy;

        const distance =
            calculateDistance(
                lat,
                lng,
                SCHOOL_LAT,
                SCHOOL_LNG
            );

        await initializeLocationMap();

        updateMapWithParentLocation(
            lat,
            lng,
            distance,
            accuracy
        );

    } catch (error) {

        console.error(
            "Geolocation error:",
            error
        );

        let text =
            "دریافت موقعیت انجام نشد.";

        if (error && error.code === 1) {
            text =
                "❌ دسترسی به موقعیت مکانی رد شده است.";
        } else if (
            error &&
            error.code === 2
        ) {
            text =
                "❌ موقعیت مکانی در دسترس نیست.";
        } else if (
            error &&
            error.code === 3
        ) {
            text =
                "❌ دریافت موقعیت زمان‌بر شد.";
        }

        setMapStatus(
            text,
            "outside"
        );

        if (locationStatus) {
            locationStatus.textContent =
                "دریافت نشد";
        }

    } finally {

        if (button) {
            button.disabled = false;

            button.textContent =
                "📍 بررسی موقعیت من";
        }
    }
}

/* =========================
   بارگذاری فراخوان قبلی
========================= */

async function loadExistingCall() {

    if (!currentStudentName) {
        return null;
    }

    try {

        const today =
            getIranDateForDatabase();

        const {
            data,
            error
        } = await db
            .from("calls")
            .select("*")
            .eq(
                "student_name",
                currentStudentName
            )
            .eq(
                "called_date",
                today
            )
            .order(
                "id",
                {
                    ascending: false
                }
            )
            .limit(1);

        if (error) {
            console.error(
                "Load call error:",
                error
            );

            return null;
        }

        if (
            data &&
            data.length > 0
        ) {

            callButton.dataset.called =
                "true";

            callButton.disabled =
                true;

            callButton.textContent =
                "✅ فراخوان ثبت شده است";

            return data[0];
        }

    } catch (error) {

        console.error(
            "Existing call error:",
            error
        );
    }

    return null;
}

/* =========================
   بروزرسانی وضعیت فراخوان
========================= */

async function updateParentCallStatus() {

    if (!currentStudentName) {
        return;
    }

    await loadExistingCall();

    updateCallScheduleUI();
}

/* =========================
   ورود والد
========================= */

async function loginParent() {

    const studentName =
        studentNameInput.value.trim();

    const parentCode =
        parentCodeInput.value.trim();

    if (!studentName) {

        showMessage(
            "لطفاً نام دانش‌آموز را وارد کنید.",
            "error"
        );

        return;
    }

    if (
        !/^\d{4}$/.test(parentCode)
    ) {

        showMessage(
            "کد ورود باید ۴ رقمی باشد.",
            "error"
        );

        return;
    }

    loginButton.disabled = true;

    loginButton.textContent =
        "در حال بررسی...";

    showMessage("");

    try {

        const {
            data,
            error
        } = await db
            .from("parent_accounts")
            .select("*")
            .eq(
                "student_name",
                studentName
            )
            .eq(
                "parent_code",
                parentCode
            )
            .limit(1);

        if (error) {
            throw error;
        }

        if (
            !data ||
            data.length === 0
        ) {

            showMessage(
                "نام دانش‌آموز یا کد ورود صحیح نیست.",
                "error"
            );

            return;
        }

        const account =
            data[0];

        currentStudentName =
            account.student_name;

        currentClassName =
            account.class_name;

        if (panelStudentName) {
            panelStudentName.textContent =
                currentStudentName;
        }

        if (panelClassName) {
            panelClassName.textContent =
                `کلاس ${currentClassName}`;
        }

        loginScreen.style.display =
            "none";

        parentPanel.style.display =
            "block";

        createLocationMapCard();

        await initializeLocationMap();

        await updateParentCallStatus();

        if (parentRefreshInterval) {
            clearInterval(
                parentRefreshInterval
            );
        }

        parentRefreshInterval =
            setInterval(
                updateParentCallStatus,
                10000
            );

        setupRealtime();

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        showMessage(
            "خطا در ارتباط با سامانه.",
            "error"
        );

    } finally {

        loginButton.disabled =
            false;

        loginButton.textContent =
            "ورود به پنل";
    }
}

/* =========================
   ثبت فراخوان
========================= */

async function callStudent() {

    if (!currentStudentName) {

        alert(
            "ابتدا وارد پنل شوید."
        );

        return;
    }

    if (
        !isCallTimeActive(
            currentClassName
        )
    ) {

        alert(
            "در حال حاضر زمان فراخوان این کلاس فعال نیست."
        );

        return;
    }

    if (
        callButton.dataset.called ===
        "true"
    ) {

        alert(
            "برای این دانش‌آموز قبلاً فراخوان ثبت شده است."
        );

        return;
    }

    callButton.disabled = true;

    callButton.textContent =
        "📍 در حال بررسی موقعیت...";

    try {

        const position =
            await getParentLocation();

        const lat =
            position.coords.latitude;

        const lng =
            position.coords.longitude;

        const accuracy =
            position.coords.accuracy;

        const distance =
            calculateDistance(
                lat,
                lng,
                SCHOOL_LAT,
                SCHOOL_LNG
            );

        await initializeLocationMap();

        updateMapWithParentLocation(
            lat,
            lng,
            distance,
            accuracy
        );

        /*
           اگر بیشتر از 50 متر باشد،
           فراخوان ثبت نمی‌شود.
        */

        if (
            distance >
            ALLOWED_RADIUS
        ) {

            alert(
                `❌ خارج از محدوده مجاز هستید.\n\nفاصله شما تا مدرسه: ${formatDistance(distance)}\nشعاع مجاز: ${formatDistance(ALLOWED_RADIUS)}`
            );

            callButton.disabled =
                false;

            callButton.textContent =
                "📢 فراخوانی دانش‌آموز";

            return;
        }

        /* =========================
           ثبت فراخوان در Supabase
        ========================= */

        callButton.textContent =
            "📢 در حال ثبت فراخوان...";

        const calledDate =
            getIranDateForDatabase();

        const calledTime =
            getIranTimeString();

        const {
            error
        } = await db
            .from("calls")
            .insert([
                {
                    student_name:
                        currentStudentName,

                    class_name:
                        currentClassName,

                    status:
                        "فراخوان شد",

                    called_date:
                        calledDate,

                    called_time:
                        calledTime
                }
            ]);

        if (error) {
            throw error;
        }

        callButton.dataset.called =
            "true";

        callButton.disabled =
            true;

        callButton.textContent =
            "✅ فراخوان با موفقیت ثبت شد";

        if (callDescription) {
            callDescription.textContent =
                "فراخوان دانش‌آموز با موفقیت ثبت شد.";
        }

        alert(
            "✅ فراخوان دانش‌آموز با موفقیت ثبت شد."
        );

    } catch (error) {

        console.error(
            "Call error:",
            error
        );

        if (
            error &&
            error.code === 1
        ) {

            alert(
                "❌ دسترسی موقعیت مکانی داده نشد."
            );

        } else if (
            error &&
            error.code === 2
        ) {

            alert(
                "❌ موقعیت مکانی در دسترس نیست."
            );

        } else if (
            error &&
            error.code === 3
        ) {

            alert(
                "❌ دریافت موقعیت مکانی زمان‌بر شد."
            );

        } else {

            alert(
                "❌ خطا در ثبت فراخوان."
            );
        }

        callButton.disabled =
            false;

        callButton.textContent =
            "📢 فراخوانی دانش‌آموز";
    }
}

/* =========================
   Realtime Supabase
========================= */

function setupRealtime() {

    if (parentCallChannel) {

        db.removeChannel(
            parentCallChannel
        );
    }

    parentCallChannel =
        db.channel(
            `parent-call-${currentStudentName}-${Date.now()}`
        );

    parentCallChannel
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "calls"
            },
            payload => {

                const student =
                    payload.new &&
                    payload.new.student_name;

                if (
                    student ===
                    currentStudentName
                ) {

                    updateParentCallStatus();
                }
            }
        )
        .subscribe();
}

/* =========================
   رویدادها
========================= */

loginButton.addEventListener(
    "click",
    loginParent
);

callButton.addEventListener(
    "click",
    callStudent
);

studentNameInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Enter"
        ) {
            loginParent();
        }
    }
);

parentCodeInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Enter"
        ) {
            loginParent();
        }
    }
);

/* =========================
   فقط عدد برای کد ورود
========================= */

parentCodeInput.addEventListener(
    "input",
    () => {

        parentCodeInput.value =
            parentCodeInput.value
                .replace(
                    /\D/g,
                    ""
                )
                .slice(0, 4);
    }
);

/* =========================
   آماده بودن Median Bridge
========================= */

window.median_library_ready =
    function () {

        console.log(
            "Median JavaScript Bridge is ready."
        );
    };

window.median_geolocation_ready =
    function () {

        console.log(
            "Median geolocation is ready."
        );
    };

/* =========================
   وضعیت اولیه
========================= */

if (parentPanel) {
    parentPanel.style.display =
        "none";
}

if (loginScreen) {
    loginScreen.style.display =
        "block";
}

updateDateTime();