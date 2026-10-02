/* =========================================================
   PARENT.JS
   بخش ۱ از ۴
   ========================================================= */

/* =========================
   SUPABASE
   ========================= */

   const SUPABASE_URL = "https://ghnpiijihybuhfetnxjp.supabase.co";

   const SUPABASE_KEY =
     "sb_publishable_SEGca8-w1pAO3_TQgMd-qA_vOvkj6jq";
   
   const supabaseClient = supabase.createClient(
     SUPABASE_URL,
     SUPABASE_KEY
   );
   
   
   /* =========================
      SCHOOL LOCATION
      ========================= */
   
   const SCHOOL_LAT = 35.76494314018861;
   const SCHOOL_LNG = 51.32257158390593;
   
   /*
      شعاع مجاز:
      ۵۰۰۰ متر = ۵ کیلومتر
   */
   const ALLOWED_RADIUS = 5000;
   
   
   /* =========================
      GLOBAL STATE
      ========================= */
   
   let currentStudentId = null;
   let currentStudentName = "";
   let currentClassName = "";
   
   let currentParentLocation = null;
   
   let parentLocationWatchId = null;
   
   let callInProgress = false;
   
   let currentCallId = null;
   
   let autoRefreshTimer = null;
   
   
   /* =========================
      DOM ELEMENTS
      ========================= */
   
   const loginSection =
     document.getElementById("loginSection");
   
   const dashboardSection =
     document.getElementById("dashboardSection");
   
   const studentNameInput =
     document.getElementById("studentName");
   
   const parentCodeInput =
     document.getElementById("parentCode");
   
   const loginButton =
     document.getElementById("loginButton");
   
   const loginMessage =
     document.getElementById("loginMessage");
   
   const logoutButton =
     document.getElementById("logoutButton");
   
   const studentNameDisplay =
     document.getElementById("studentNameDisplay");
   
   const classNameDisplay =
     document.getElementById("classNameDisplay");
   
   const callButton =
     document.getElementById("callButton");
   
   const callMessageInput =
     document.getElementById("callMessage");
   
   const callStatus =
     document.getElementById("callStatus");
   
   const existingCallContainer =
     document.getElementById("existingCallContainer");
   
   const locationStatus =
     document.getElementById("locationStatus");
   
   const allowedRadiusValue =
     document.getElementById("allowedRadiusValue");
   
   const liveParentDistance =
     document.getElementById("liveParentDistance");
   
   const liveParentStatus =
     document.getElementById("liveParentStatus");
   
   const parentLocationIcon =
     document.getElementById("parentLocationIcon");
   
   const parentLocationCard =
     document.querySelector(".parent-location-card");
   
   const locationRefreshButton =
     document.getElementById("locationRefreshButton");
   
   
   /* =========================
      INITIAL UI
      ========================= */
   
   if (allowedRadiusValue) {
     allowedRadiusValue.textContent =
       formatNumberPersian(ALLOWED_RADIUS);
   }
   
   if (locationStatus) {
     locationStatus.textContent =
       `محدوده مجاز: ${formatNumberPersian(ALLOWED_RADIUS)} متر`;
   }
   
   
   /* =========================
      PERSIAN NUMBER
      ========================= */
   
   function formatNumberPersian(value) {
     if (value === null || value === undefined) {
       return "";
     }
   
     return String(value).replace(
       /\d/g,
       digit => "۰۱۲۳۴۵۶۷۸۹"[digit]
     );
   }
   
   
   /* =========================
      PERSIAN NAME NORMALIZATION
      ========================= */
   
   /*
      این تابع باعث می‌شود موارد زیر یکسان در نظر گرفته شوند:
   
      علی  احمدی
      علی احمدی
      علی‌احمدی
      علی احمدی
   
      همچنین تفاوت‌های رایج فارسی/عربی را اصلاح می‌کند.
   */
   
   function normalizePersianName(value) {
     if (!value) {
       return "";
     }
   
     return String(value)
       .normalize("NFKC")
   
       // حروف عربی رایج
       .replace(/ي/g, "ی")
       .replace(/ى/g, "ی")
       .replace(/ك/g, "ک")
       .replace(/ة/g, "ه")
       .replace(/ۀ/g, "ه")
   
       // الف‌های عربی
       .replace(/[أإآ]/g, "ا")
   
       // حذف حرکات
       .replace(/[\u064B-\u065F\u0670]/g, "")
   
       // حذف کشیده
       .replace(/ـ/g, "")
   
       // نیم‌فاصله و ZWJ
       .replace(/[\u200C\u200D]/g, " ")
   
       // چند فاصله پشت سر هم
       .replace(/\s+/g, " ")
   
       .trim()
   
       .toLowerCase();
   }
   
   
   /* =========================
      COMPACT NAME
      ========================= */
   
   /*
      تمام فاصله‌ها را حذف می‌کنیم.
   
      مثال:
   
      "علی احمدی"
      "علی  احمدی"
      "علیاحمدی"
   
      همگی تبدیل می‌شوند به:
   
      "علیاحمدی"
   */
   
   function compactName(value) {
     return normalizePersianName(value)
       .replace(/\s+/g, "");
   }
   
   
   /* =========================
      LEVENSHTEIN DISTANCE
      ========================= */
   
   function levenshteinDistance(a, b) {
     const first = String(a || "");
     const second = String(b || "");
   
     if (first === second) {
       return 0;
     }
   
     if (!first.length) {
       return second.length;
     }
   
     if (!second.length) {
       return first.length;
     }
   
     const previousRow =
       Array.from(
         { length: second.length + 1 },
         (_, index) => index
       );
   
     for (let i = 0; i < first.length; i++) {
       const currentRow = [i + 1];
   
       for (let j = 0; j < second.length; j++) {
         const insertCost =
           currentRow[j] + 1;
   
         const deleteCost =
           previousRow[j + 1] + 1;
   
         const replaceCost =
           previousRow[j] +
           (first[i] === second[j] ? 0 : 1);
   
         currentRow.push(
           Math.min(
             insertCost,
             deleteCost,
             replaceCost
           )
         );
       }
   
       previousRow.splice(
         0,
         previousRow.length,
         ...currentRow
       );
     }
   
     return previousRow[second.length];
   }
   
   
   /* =========================
      NAME SIMILARITY
      ========================= */
   
   function nameSimilarity(
     enteredName,
     databaseName
   ) {
     const a = compactName(enteredName);
     const b = compactName(databaseName);
   
     if (!a || !b) {
       return 0;
     }
   
     if (a === b) {
       return 1;
     }
   
     const distance =
       levenshteinDistance(a, b);
   
     const maxLength =
       Math.max(a.length, b.length);
   
     if (!maxLength) {
       return 1;
     }
   
     return 1 - distance / maxLength;
   }
   
   
   /* =========================
      NAME MATCHING
      ========================= */
   
   function isNameSimilar(
     enteredName,
     databaseName
   ) {
     const normalizedEntered =
       compactName(enteredName);
   
     const normalizedDatabase =
       compactName(databaseName);
   
     if (!normalizedEntered ||
         !normalizedDatabase) {
       return false;
     }
   
     // اگر فقط فاصله‌ها متفاوت باشند
     if (normalizedEntered === normalizedDatabase) {
       return true;
     }
   
     const similarity =
       nameSimilarity(
         normalizedEntered,
         normalizedDatabase
       );
   
     /*
        ۰.۸۳ یعنی:
        - یک غلط جزئی معمولاً پذیرفته می‌شود
        - چند غلط جدی پذیرفته نمی‌شود
     */
   
     return similarity >= 0.83;
   }
   
   
   /* =========================
      BEST NAME MATCH
      ========================= */
   
   function findBestNameMatch(
     enteredName,
     accounts
   ) {
     if (
       !enteredName ||
       !Array.isArray(accounts) ||
       !accounts.length
     ) {
       return null;
     }
   
     let bestAccount = null;
     let bestSimilarity = 0;
   
     for (const account of accounts) {
       if (!account || !account.student_name) {
         continue;
       }
   
       const similarity =
         nameSimilarity(
           enteredName,
           account.student_name
         );
   
       if (similarity > bestSimilarity) {
         bestSimilarity = similarity;
         bestAccount = account;
       }
     }
   
     if (!bestAccount) {
       return null;
     }
   
     if (bestSimilarity < 0.83) {
       return null;
     }
   
     return {
       account: bestAccount,
       similarity: bestSimilarity
     };
   }
   
   
   /* =========================
      DISTANCE CALCULATION
      ========================= */
   
   function calculateDistance(
     lat1,
     lon1,
     lat2,
     lon2
   ) {
     const earthRadius = 6371000;
   
     const toRadians =
       degrees => degrees * Math.PI / 180;
   
     const dLat =
       toRadians(lat2 - lat1);
   
     const dLon =
       toRadians(lon2 - lon1);
   
     const a =
       Math.sin(dLat / 2) ** 2 +
       Math.cos(toRadians(lat1)) *
       Math.cos(toRadians(lat2)) *
       Math.sin(dLon / 2) ** 2;
   
     const c =
       2 * Math.atan2(
         Math.sqrt(a),
         Math.sqrt(1 - a)
       );
   
     return earthRadius * c;
   }
   
   
   /* =========================
      DISTANCE FORMAT
      ========================= */
   
   function formatDistance(distance) {
     if (
       distance === null ||
       distance === undefined ||
       Number.isNaN(distance)
     ) {
       return "---";
     }
   
     return formatNumberPersian(
       Math.round(distance)
     );
   }
   
   
   /* =========================
      IRAN DATE / TIME
      ========================= */
   
   function getIranDate() {
     return new Date(
       new Date().toLocaleString(
         "en-US",
         {
           timeZone: "Asia/Tehran"
         }
       )
     );
   }
   
   
   function getIranDateString() {
     const date = getIranDate();
   
     const year =
       date.getFullYear();
   
     const month =
       String(date.getMonth() + 1)
         .padStart(2, "0");
   
     const day =
       String(date.getDate())
         .padStart(2, "0");
   
     return `${year}-${month}-${day}`;
   }
   
   
   /* =========================
      UI HELPERS
      ========================= */
   
   function showLoginMessage(
     message,
     type = "error"
   ) {
     if (!loginMessage) {
       return;
     }
   
     loginMessage.textContent = message;
   
     loginMessage.className =
       `message ${type}`;
   }
   
   
   function showCallMessage(
     message,
     type = "info"
   ) {
     if (!callStatus) {
       return;
     }
   
     callStatus.textContent = message;
   
     callStatus.className =
       `call-status ${type}`;
   }
   
   
   function setLoading(
     button,
     loading,
     loadingText = "در حال بررسی..."
   ) {
     if (!button) {
       return;
     }
   
     if (loading) {
       button.dataset.originalText =
         button.textContent;
   
       button.disabled = true;
       button.textContent =
         loadingText;
     } else {
       button.disabled = false;
   
       if (button.dataset.originalText) {
         button.textContent =
           button.dataset.originalText;
       }
     }
   }
   /* =========================================================
   PARENT.JS
   بخش ۲ از ۴
   ========================================================= */


/* =========================
   LOCATION CARD UI
   ========================= */

function updateLiveLocationCard(
    distance,
    latitude,
    longitude
  ) {
    currentParentLocation = {
      latitude,
      longitude,
      distance
    };
  
    if (liveParentDistance) {
      liveParentDistance.textContent =
        formatDistance(distance);
    }
  
    if (parentLocationCard) {
      parentLocationCard.classList.remove(
        "location-loading",
        "location-inside",
        "location-outside"
      );
  
      if (distance <= ALLOWED_RADIUS) {
        parentLocationCard.classList.add(
          "location-inside"
        );
      } else {
        parentLocationCard.classList.add(
          "location-outside"
        );
      }
    }
  
    if (parentLocationIcon) {
      parentLocationIcon.textContent =
        distance <= ALLOWED_RADIUS
          ? "✅"
          : "⚠️";
    }
  
    if (liveParentStatus) {
      if (distance <= ALLOWED_RADIUS) {
        liveParentStatus.textContent =
          "موقعیت شما داخل محدوده مجاز است";
      } else {
        liveParentStatus.textContent =
          "موقعیت شما خارج از محدوده مجاز است";
      }
    }
  
    if (locationStatus) {
      locationStatus.textContent =
        `فاصله فعلی: ${formatDistance(distance)} متر`;
    }
  }
  
  
  function setLocationLoading() {
    if (liveParentDistance) {
      liveParentDistance.textContent =
        "---";
    }
  
    if (liveParentStatus) {
      liveParentStatus.textContent =
        "در حال دریافت موقعیت...";
    }
  
    if (parentLocationIcon) {
      parentLocationIcon.textContent =
        "📍";
    }
  
    if (parentLocationCard) {
      parentLocationCard.classList.remove(
        "location-inside",
        "location-outside"
      );
  
      parentLocationCard.classList.add(
        "location-loading"
      );
    }
  }
  
  
  function setLocationError(message) {
    if (liveParentDistance) {
      liveParentDistance.textContent =
        "---";
    }
  
    if (liveParentStatus) {
      liveParentStatus.textContent =
        message;
    }
  
    if (parentLocationIcon) {
      parentLocationIcon.textContent =
        "⚠️";
    }
  
    if (parentLocationCard) {
      parentLocationCard.classList.remove(
        "location-inside",
        "location-outside"
      );
  
      parentLocationCard.classList.add(
        "location-loading"
      );
    }
  
    if (locationStatus) {
      locationStatus.textContent =
        message;
    }
  }
  
  
  /* =========================
     GPS SUCCESS
     ========================= */
  
  function handleLocationSuccess(position) {
    const latitude =
      position.coords.latitude;
  
    const longitude =
      position.coords.longitude;
  
    const distance =
      calculateDistance(
        latitude,
        longitude,
        SCHOOL_LAT,
        SCHOOL_LNG
      );
  
    updateLiveLocationCard(
      distance,
      latitude,
      longitude
    );
  }
  
  
  /* =========================
     GPS ERROR
     ========================= */
  
  function handleLocationError(error) {
    console.error(
      "Geolocation error:",
      error
    );
  
    let message =
      "دریافت موقعیت امکان‌پذیر نیست.";
  
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message =
          "دسترسی به موقعیت مکانی رد شده است.";
        break;
  
      case error.POSITION_UNAVAILABLE:
        message =
          "موقعیت مکانی در دسترس نیست.";
        break;
  
      case error.TIMEOUT:
        message =
          "زمان دریافت موقعیت به پایان رسید.";
        break;
    }
  
    setLocationError(message);
  }
  
  
  /* =========================
     START LIVE GPS WATCH
     ========================= */
  
  function startParentLocationWatch() {
    if (!navigator.geolocation) {
      setLocationError(
        "مرورگر شما از GPS پشتیبانی نمی‌کند."
      );
  
      return;
    }
  
    if (parentLocationWatchId !== null) {
      navigator.geolocation.clearWatch(
        parentLocationWatchId
      );
  
      parentLocationWatchId = null;
    }
  
    setLocationLoading();
  
    parentLocationWatchId =
      navigator.geolocation.watchPosition(
        handleLocationSuccess,
        handleLocationError,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
  }
  
  
  /* =========================
     STOP LIVE GPS WATCH
     ========================= */
  
  function stopParentLocationWatch() {
    if (parentLocationWatchId !== null) {
      navigator.geolocation.clearWatch(
        parentLocationWatchId
      );
  
      parentLocationWatchId = null;
    }
  }
  
  
  /* =========================
     ONE SHOT LOCATION
     ========================= */
  
  function refreshParentLocation() {
    return new Promise(
      (resolve, reject) => {
  
        if (!navigator.geolocation) {
          reject(
            new Error(
              "مرورگر از موقعیت مکانی پشتیبانی نمی‌کند."
            )
          );
  
          return;
        }
  
        setLocationLoading();
  
        navigator.geolocation.getCurrentPosition(
          position => {
            handleLocationSuccess(position);
  
            resolve({
              latitude:
                position.coords.latitude,
  
              longitude:
                position.coords.longitude,
  
              distance:
                calculateDistance(
                  position.coords.latitude,
                  position.coords.longitude,
                  SCHOOL_LAT,
                  SCHOOL_LNG
                )
            });
          },
  
          error => {
            handleLocationError(error);
            reject(error);
          },
  
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      }
    );
  }
  
  
  /* =========================
     LOGIN
     ========================= */
  
  if (loginButton) {
    loginButton.addEventListener(
      "click",
      async () => {
  
        const enteredName =
          normalizePersianName(
            studentNameInput
              ? studentNameInput.value
              : ""
          );
  
        const code =
          parentCodeInput
            ? parentCodeInput.value.trim()
            : "";
  
        if (!enteredName) {
          showLoginMessage(
            "لطفاً نام دانش‌آموز را وارد کنید."
          );
  
          return;
        }
  
        if (!code) {
          showLoginMessage(
            "لطفاً کد والد را وارد کنید."
          );
  
          return;
        }
  
        setLoading(
          loginButton,
          true,
          "در حال بررسی..."
        );
  
        showLoginMessage(
          "در حال بررسی اطلاعات...",
          "info"
        );
  
        try {
  
          /*
             فقط با parent_code جستجو می‌کنیم.
  
             مهم:
             اینجا دیگر نباید بنویسیم:
  
             .eq("student_name", enteredName)
  
             چون در آن صورت غلط املایی قابل قبول نیست.
          */
  
          const {
            data: accounts,
            error
          } = await supabaseClient
            .from("parent_accounts")
            .select(
              "id, student_name, class_name"
            )
            .eq(
              "parent_code",
              code
            );
  
          if (error) {
            console.error(
              "Login query error:",
              error
            );
  
            throw error;
          }
  
          if (
            !accounts ||
            !accounts.length
          ) {
            showLoginMessage(
              "کد والد صحیح نیست یا اطلاعاتی برای آن پیدا نشد."
            );
  
            return;
          }
  
          /*
             پیدا کردن نزدیک‌ترین نام
          */
  
          const match =
            findBestNameMatch(
              enteredName,
              accounts
            );
  
          if (!match) {
            showLoginMessage(
              "نام دانش‌آموز با اطلاعات ثبت‌شده مطابقت ندارد."
            );
  
            return;
          }
  
          const account =
            match.account;
  
          currentStudentId =
            account.id;
  
          /*
             نام اصلی دیتابیس را نگه می‌داریم
             تا بعداً اطلاعات کاملاً درست ثبت شود.
          */
  
          currentStudentName =
            account.student_name;
  
          currentClassName =
            account.class_name || "";
  
          /*
             نمایش اطلاعات دانش‌آموز
          */
  
          if (studentNameDisplay) {
            studentNameDisplay.textContent =
              currentStudentName;
          }
  
          if (classNameDisplay) {
            classNameDisplay.textContent =
              currentClassName;
          }
  
          /*
             مخفی کردن ورود
          */
  
          if (loginSection) {
            loginSection.style.display =
              "none";
          }
  
          if (dashboardSection) {
            dashboardSection.style.display =
              "";
          }
  
          showLoginMessage(
            "",
            "success"
          );
  
          /*
             شروع GPS لحظه‌ای
          */
  
          startParentLocationWatch();
  
          /*
             بررسی تماس موجود
          */
  
          await loadExistingCall();
  
        } catch (error) {
  
          console.error(
            "Login error:",
            error
          );
  
          showLoginMessage(
            "خطایی در ارتباط با سرور رخ داد. دوباره تلاش کنید."
          );
  
        } finally {
  
          setLoading(
            loginButton,
            false
          );
        }
      }
    );
  }
  
  
  /* =========================
     MANUAL LOCATION REFRESH
     ========================= */
  
  if (locationRefreshButton) {
    locationRefreshButton.addEventListener(
      "click",
      async () => {
  
        try {
          await refreshParentLocation();
        } catch (error) {
          console.error(error);
        }
      }
    );
  }
  
  
  /* =========================
     LOGOUT
     ========================= */
  
  if (logoutButton) {
    logoutButton.addEventListener(
      "click",
      () => {
  
        stopParentLocationWatch();
  
        currentStudentId = null;
        currentStudentName = "";
        currentClassName = "";
  
        currentParentLocation = null;
        currentCallId = null;
  
        if (autoRefreshTimer) {
          clearInterval(
            autoRefreshTimer
          );
  
          autoRefreshTimer = null;
        }
  
        if (dashboardSection) {
          dashboardSection.style.display =
            "none";
        }
  
        if (loginSection) {
          loginSection.style.display =
            "";
        }
  
        if (studentNameInput) {
          studentNameInput.value = "";
        }
  
        if (parentCodeInput) {
          parentCodeInput.value = "";
        }
  
        setLocationLoading();
  
        if (locationStatus) {
          locationStatus.textContent =
            `محدوده مجاز: ${formatNumberPersian(ALLOWED_RADIUS)} متر`;
        }
      }
    );
  }
  /* =========================================================
   PARENT.JS
   بخش ۳ از ۴
   ========================================================= */


/* =========================
   CALL BUTTON
   ========================= */

if (callButton) {
    callButton.addEventListener(
      "click",
      async () => {
  
        if (callInProgress) {
          return;
        }
  
        if (!currentStudentId) {
          showCallMessage(
            "ابتدا وارد حساب خود شوید.",
            "error"
          );
  
          return;
        }
  
        callInProgress = true;
  
        setLoading(
          callButton,
          true,
          "در حال بررسی موقعیت..."
        );
  
        showCallMessage(
          "در حال بررسی موقعیت مکانی شما...",
          "info"
        );
  
        try {
  
          /*
             قبل از ثبت تماس یک GPS تازه می‌گیریم.
             بنابراین تصمیم داخل/خارج محدوده
             بر اساس موقعیت فعلی خواهد بود.
          */
  
          const location =
            await refreshParentLocation();
  
          const distance =
            location.distance;
  
          if (distance > ALLOWED_RADIUS) {
  
            showCallMessage(
              `شما خارج از محدوده مجاز هستید. فاصله شما ${formatDistance(distance)} متر است.`,
              "error"
            );
  
            return;
          }
  
          /*
             داخل محدوده هستیم.
          */
  
          showCallMessage(
            "موقعیت شما مجاز است. در حال ثبت تماس...",
            "info"
          );
  
          const message =
            callMessageInput
              ? callMessageInput.value.trim()
              : "";
  
          await createCall(
            location,
            message
          );
  
        } catch (error) {
  
          console.error(
            "Call error:",
            error
          );
  
          /*
             اگر خودمان پیام بهتری قبلاً نشان داده‌ایم،
             آن را با خطای عمومی عوض نمی‌کنیم.
          */
  
          if (
            error &&
            error.message
          ) {
            showCallMessage(
              error.message,
              "error"
            );
          } else {
            showCallMessage(
              "ثبت تماس انجام نشد. دوباره تلاش کنید.",
              "error"
            );
          }
  
        } finally {
  
          callInProgress = false;
  
          setLoading(
            callButton,
            false
          );
        }
      }
    );
  }
  
  
  /* =========================
     CREATE CALL
     ========================= */
  
  async function createCall(
    location,
    message
  ) {
    if (!currentStudentId) {
      throw new Error(
        "شناسه دانش‌آموز مشخص نیست."
      );
    }
  
    const today =
      getIranDateString();
  
    /*
       بررسی می‌کنیم امروز تماس قبلی وجود دارد یا نه.
    */
  
    const {
      data: existingCalls,
      error: existingError
    } = await supabaseClient
      .from("parent_calls")
      .select("*")
      .eq(
        "student_id",
        currentStudentId
      )
      .eq(
        "call_date",
        today
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      )
      .limit(1);
  
    if (existingError) {
      console.error(
        existingError
      );
  
      /*
         اگر ستون call_date در پروژه شما
         متفاوت است، این قسمت را با ساختار
         واقعی جدول هماهنگ کنید.
      */
  
      throw new Error(
        "خطا در بررسی تماس‌های قبلی."
      );
    }
  
    if (
      existingCalls &&
      existingCalls.length
    ) {
      currentCallId =
        existingCalls[0].id;
  
      showCallMessage(
        "برای امروز قبلاً درخواست ثبت شده است.",
        "info"
      );
  
      await loadExistingCall();
  
      return;
    }
  
  
    /* =========================
       INSERT NEW CALL
       ========================= */
  
    const {
      data,
      error
    } = await supabaseClient
      .from("parent_calls")
      .insert([
        {
          student_id:
            currentStudentId,
  
          student_name:
            currentStudentName,
  
          class_name:
            currentClassName,
  
          call_date:
            today,
  
          message:
            message || null,
  
          parent_lat:
            location.latitude,
  
          parent_lng:
            location.longitude,
  
          distance:
            Math.round(
              location.distance
            )
        }
      ])
      .select()
      .single();
  
    if (error) {
  
      console.error(
        "Create call error:",
        error
      );
  
      throw new Error(
        "ثبت درخواست تماس با خطا مواجه شد."
      );
    }
  
    currentCallId =
      data.id;
  
    showCallMessage(
      "درخواست تماس با موفقیت ثبت شد.",
      "success"
    );
  
    if (callMessageInput) {
      callMessageInput.value = "";
    }
  
    renderExistingCall(data);
  }
  
  
  /* =========================
     LOAD EXISTING CALL
     ========================= */
  
  async function loadExistingCall() {
  
    if (!currentStudentId) {
      return;
    }
  
    const today =
      getIranDateString();
  
    try {
  
      const {
        data,
        error
      } = await supabaseClient
        .from("parent_calls")
        .select("*")
        .eq(
          "student_id",
          currentStudentId
        )
        .eq(
          "call_date",
          today
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(1);
  
      if (error) {
        console.error(
          "Load existing call error:",
          error
        );
  
        return;
      }
  
      if (
        data &&
        data.length
      ) {
        currentCallId =
          data[0].id;
  
        renderExistingCall(
          data[0]
        );
      } else {
        currentCallId = null;
  
        clearExistingCall();
      }
  
    } catch (error) {
  
      console.error(
        error
      );
    }
  }
  
  
  /* =========================
     RENDER EXISTING CALL
     ========================= */
  
  function renderExistingCall(call) {
  
    if (!existingCallContainer) {
      return;
    }
  
    if (!call) {
      clearExistingCall();
      return;
    }
  
    let statusText =
      "درخواست ثبت شده";
  
    let statusClass =
      "pending";
  
    /*
       اگر در دیتابیس status دارید،
       وضعیت را از همان می‌خوانیم.
    */
  
    const status =
      String(
        call.status || ""
      ).toLowerCase();
  
    if (
      status === "approved" ||
      status === "accepted" ||
      status === "confirmed"
    ) {
      statusText =
        "درخواست تأیید شده است";
  
      statusClass =
        "success";
  
    } else if (
      status === "rejected" ||
      status === "declined"
    ) {
      statusText =
        "درخواست رد شده است";
  
      statusClass =
        "error";
  
    } else if (
      status === "completed" ||
      status === "done"
    ) {
      statusText =
        "تماس انجام شده است";
  
      statusClass =
        "success";
    }
  
    const distance =
      call.distance !== null &&
      call.distance !== undefined
        ? `${formatDistance(call.distance)} متر`
        : "---";
  
    existingCallContainer.innerHTML = `
      <div class="existing-call-card">
        <div class="existing-call-header">
          <span>📞 درخواست امروز</span>
          <span class="call-status-badge ${statusClass}">
            ${statusText}
          </span>
        </div>
  
        <div class="existing-call-body">
  
          <div class="existing-call-row">
            <span>دانش‌آموز</span>
            <strong>
              ${escapeHtml(
                call.student_name ||
                currentStudentName
              )}
            </strong>
          </div>
  
          <div class="existing-call-row">
            <span>کلاس</span>
            <strong>
              ${escapeHtml(
                call.class_name ||
                currentClassName ||
                "---"
              )}
            </strong>
          </div>
  
          <div class="existing-call-row">
            <span>فاصله هنگام ثبت</span>
            <strong>
              ${distance}
            </strong>
          </div>
  
          ${
            call.message
              ? `
                <div class="existing-call-message">
                  <span>پیام والد</span>
                  <p>
                    ${escapeHtml(
                      call.message
                    )}
                  </p>
                </div>
              `
              : ""
          }
  
        </div>
      </div>
    `;
  }
  
  
  /* =========================
     CLEAR EXISTING CALL
     ========================= */
  
  function clearExistingCall() {
  
    if (!existingCallContainer) {
      return;
    }
  
    existingCallContainer.innerHTML = "";
  }
  
  
  /* =========================
     HTML ESCAPE
     ========================= */
  
  function escapeHtml(value) {
  
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }
  
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  /* =========================================================
   PARENT.JS
   بخش ۴ از ۴
   ========================================================= */


/* =========================
   AUTO REFRESH EXISTING CALL
   ========================= */

function startAutoRefresh() {

    stopAutoRefresh();
  
    /*
       هر ۱۰ ثانیه وضعیت تماس بررسی می‌شود.
    */
  
    autoRefreshTimer =
      setInterval(
        async () => {
  
          if (!currentStudentId) {
            return;
          }
  
          try {
            await loadExistingCall();
          } catch (error) {
            console.error(
              "Auto refresh error:",
              error
            );
          }
  
        },
        10000
      );
  }
  
  
  function stopAutoRefresh() {
  
    if (autoRefreshTimer) {
  
      clearInterval(
        autoRefreshTimer
      );
  
      autoRefreshTimer = null;
    }
  }
  
  
  /* =========================
     SUPABASE REALTIME
     ========================= */
  
  let realtimeChannel = null;
  
  
  function startRealtime() {
  
    if (realtimeChannel) {
      try {
        supabaseClient.removeChannel(
          realtimeChannel
        );
      } catch (error) {
        console.error(error);
      }
  
      realtimeChannel = null;
    }
  
    /*
       بدون student_id نمی‌توانیم
       کانال مخصوص دانش‌آموز را بسازیم.
    */
  
    if (!currentStudentId) {
      return;
    }
  
    realtimeChannel =
      supabaseClient
        .channel(
          `parent-call-${currentStudentId}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "parent_calls",
            filter:
              `student_id=eq.${currentStudentId}`
          },
          payload => {
  
            console.log(
              "Realtime call update:",
              payload
            );
  
            loadExistingCall();
          }
        )
        .subscribe(
          status => {
  
            console.log(
              "Realtime status:",
              status
            );
          }
        );
  }
  
  
  function stopRealtime() {
  
    if (realtimeChannel) {
  
      try {
  
        supabaseClient.removeChannel(
          realtimeChannel
        );
  
      } catch (error) {
  
        console.error(
          "Realtime cleanup error:",
          error
        );
      }
  
      realtimeChannel = null;
    }
  }
  
  
  /* =========================
     PATCH LOGIN SUCCESS
     ========================= */
  
  /*
     چون بعد از ورود باید Auto Refresh و
     Realtime هم فعال شوند، این listener
     به صورت جداگانه وضعیت ورود را بررسی می‌کند.
  */
  
  let lastLoggedInStudentId = null;
  
  setInterval(
    () => {
  
      if (
        currentStudentId &&
        currentStudentId !==
          lastLoggedInStudentId
      ) {
  
        lastLoggedInStudentId =
          currentStudentId;
  
        startAutoRefresh();
        startRealtime();
  
      } else if (
        !currentStudentId &&
        lastLoggedInStudentId
      ) {
  
        lastLoggedInStudentId =
          null;
  
        stopAutoRefresh();
        stopRealtime();
      }
  
    },
    1000
  );
  
  
  /* =========================
     PAGE VISIBILITY
     ========================= */
  
  document.addEventListener(
    "visibilitychange",
    () => {
  
      if (
        document.visibilityState ===
        "visible"
      ) {
  
        /*
           وقتی کاربر دوباره به صفحه برمی‌گردد،
           یک GPS تازه می‌گیریم.
        */
  
        if (currentStudentId) {
          refreshParentLocation()
            .catch(error => {
              console.error(
                "Visibility location error:",
                error
              );
            });
        }
      }
    }
  );
  
  
  /* =========================
     INITIAL LOCATION UI
     ========================= */
  
  function initializeParentPage() {
  
    if (allowedRadiusValue) {
      allowedRadiusValue.textContent =
        formatNumberPersian(
          ALLOWED_RADIUS
        );
    }
  
    if (locationStatus) {
      locationStatus.textContent =
        `محدوده مجاز: ${formatNumberPersian(ALLOWED_RADIUS)} متر`;
    }
  
    setLocationLoading();
  
    if (dashboardSection) {
      dashboardSection.style.display =
        "none";
    }
  
    if (loginSection) {
      loginSection.style.display =
        "";
    }
  }
  
  
  /* =========================
     CLEANUP
     ========================= */
  
  window.addEventListener(
    "beforeunload",
    () => {
  
      stopParentLocationWatch();
  
      stopAutoRefresh();
  
      stopRealtime();
    }
  );
  
  
  /* =========================
     START
     ========================= */
  
  initializeParentPage();