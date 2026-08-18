(function () {

  // =========================================================
  // CONFIGURAÇÃO DAS TRANSFORMAÇÕES
  // =========================================================

  const stages = [
    {
      min: 0,
      name: "FORMA BASE",
      color: "#29b6f6",
      label: "BASE"
    },
    {
      min: 12,
      name: "KAIOKEN",
      color: "#ff5a1f",
      label: "KAIOKEN"
    },
    {
      min: 30,
      name: "SUPER SAIYAJIN",
      color: "#ffcf3a",
      label: "SS JIN"
    },
    {
      min: 50,
      name: "SUPER SAIYAJIN 2",
      color: "#ffcf3a",
      label: "SS JIN 2"
    },
    {
      min: 68,
      name: "SUPER SAIYAJIN 3",
      color: "#ffcf3a",
      label: "SS JIN 3"
    },
    {
      min: 85,
      name: "SAIYAJIN BLUE",
      color: "#4fd8ff",
      label: "SS BLUE"
    },
    {
      min: 96,
      name: "INSTINTO SUPERIOR",
      color: "#f5f9ff",
      label: "LIMITE"
    }
  ];


  // =========================================================
  // ELEMENTOS DA INTERFACE
  // =========================================================

  const gaugeFrame =
    document.getElementById("gaugeFrame");

  const fillEl =
    document.getElementById("fill");

  const peakEl =
    document.getElementById("peakMarker");

  const particlesEl =
    document.getElementById("particles");

  const powerNowEl =
    document.getElementById("powerNow");

  const powerRecordEl =
    document.getElementById("powerRecord");

  const stageNameEl =
    document.getElementById("stageName");

  const statusEl =
    document.getElementById("status");

  const startBtn =
    document.getElementById("startBtn");

  const resetBtn =
    document.getElementById("resetBtn");

  const fsBtn =
    document.getElementById("fsBtn");

  const sensSlider =
    document.getElementById("sensitivity");

  const legendRows =
    document.querySelectorAll(".legend .row");

  const flashEl =
    document.getElementById("flash");

  const over9000El =
    document.getElementById("over9000text");

  const appEl =
    document.getElementById("app");

  const cracksEl =
    document.getElementById("cracks");

  const glitchEl =
    document.getElementById("glitchOverlay");

  const explosionEl =
    document.getElementById("explosion");

  const shockEl =
    document.getElementById("shock");


  // =========================================================
  // LINHAS DE TRANSFORMAÇÃO
  // =========================================================

  stages.forEach(stage => {

    if (stage.min <= 0) {
      return;
    }

    const line =
      document.createElement("div");

    line.className = "threshold";

    line.style.bottom =
      stage.min + "%";

    const label =
      document.createElement("span");

    label.textContent =
      stage.label;

    line.appendChild(label);

    gaugeFrame.appendChild(line);

  });


  // =========================================================
  // VARIÁVEIS DE ÁUDIO
  // =========================================================

  let audioCtx = null;
  let analyser = null;
  let dataArray = null;
  let stream = null;

  let listening = false;

  let noiseFloor = -55;

  let ceilingDb = -6;

  let smoothedPct = 0;

  let peakPct = 0;

  let peakDecayTimer = null;

  let sessionRecord = 0;

  let hasHitOver9000 = false;

  let particleTimer = null;

  let rafId = null;

  let exploding = false;


  // =========================================================
  // SENSIBILIDADE
  // =========================================================

  function sensitivityOffset() {

    const value =
      parseInt(
        sensSlider.value,
        10
      );

    return (value - 5) * 3;

  }


  // =========================================================
  // DECIBEL → PORCENTAGEM
  // =========================================================

  function dbToPercent(db) {

    const floor =
      noiseFloor +
      6 -
      sensitivityOffset();

    const range =
      Math.max(
        6,
        ceilingDb - floor
      );

    let pct =
      ((db - floor) / range) * 100;

    return Math.max(
      0,
      Math.min(100, pct)
    );

  }


  // =========================================================
  // IDENTIFICA TRANSFORMAÇÃO
  // =========================================================

  function currentStageIndex(pct) {

    let index = 0;

    for (
      let i = 0;
      i < stages.length;
      i++
    ) {

      if (
        pct >= stages[i].min
      ) {
        index = i;
      }

    }

    return index;

  }


  // =========================================================
  // CONVERTE PORCENTAGEM EM PODER
  // =========================================================

  function powerLevelFromPct(pct) {

    return Math.round(
      Math.pow(
        pct / 100,
        3
      ) * 200000
    );

  }


  // =========================================================
  // PARTÍCULAS
  // =========================================================

  function spawnParticles(
    rate,
    color
  ) {

    if (particleTimer) {
      return;
    }

    particleTimer =
      setInterval(() => {

        for (
          let i = 0;
          i < rate;
          i++
        ) {

          const spark =
            document.createElement("div");

          spark.className =
            "spark";

          spark.style.left =
            Math.random() * 100 + "%";

          spark.style.background =
            color;

          spark.style.boxShadow =
            "0 0 6px " + color;

          const duration =
            0.7 +
            Math.random() * 0.9;

          spark.style.animation =
            `rise ${duration}s ease-out forwards`;

          particlesEl.appendChild(
            spark
          );

          setTimeout(
            () => spark.remove(),
            duration * 1000 + 50
          );

        }

      }, 120);

  }


  function stopParticles() {

    if (particleTimer) {

      clearInterval(
        particleTimer
      );

      particleTimer = null;

    }

  }


  // =========================================================
  // OVER 9000
  // =========================================================

  function triggerOver9000() {

    if (hasHitOver9000) {
      return;
    }

    hasHitOver9000 = true;

    flashEl.classList.remove("go");

    void flashEl.offsetWidth;

    flashEl.classList.add("go");


    over9000El.classList.remove("go");

    void over9000El.offsetWidth;

    over9000El.classList.add("go");


    appEl.classList.remove("shake");

    void appEl.offsetWidth;

    appEl.classList.add("shake");


    setTimeout(() => {

      hasHitOver9000 = false;

    }, 5000);

  }


  // =========================================================
  // EXPLOSÃO
  // =========================================================

  function spawnBurst() {

    const count = 40;

    for (
      let i = 0;
      i < count;
      i++
    ) {

      const particle =
        document.createElement("div");

      particle.className =
        "burst-particle";

      const angle =
        Math.PI * 2 *
        (i / count) +
        Math.random() * 0.3;

      const distance =
        30 +
        Math.random() * 55;

      const colors = [
        "#fff",
        "#ffcf3a",
        "#ff5a1f",
        "#ff1e3c"
      ];

      particle.style.background =
        colors[i % colors.length];

      particle.style.setProperty(
        "--dx",
        Math.cos(angle) *
          distance +
          "vw"
      );

      particle.style.setProperty(
        "--dy",
        Math.sin(angle) *
          distance +
          "vh"
      );

      particle.style.animation =
        `burstFly ${
          0.9 +
          Math.random() * 0.6
        }s cubic-bezier(.15,.8,.3,1) forwards`;

      document.body.appendChild(
        particle
      );

      setTimeout(
        () => particle.remove(),
        1600
      );

    }

  }


  // =========================================================
  // QUEBRA DO SCOUTER
  // =========================================================

  function triggerScouterBreak() {

    if (exploding) {
      return;
    }

    exploding = true;

    gaugeFrame.classList.add(
      "broken"
    );

    cracksEl.classList.add(
      "show"
    );

    appEl.classList.add(
      "megashake"
    );

    glitchEl.classList.remove(
      "go"
    );

    void glitchEl.offsetWidth;

    glitchEl.classList.add(
      "go"
    );

    explosionEl.classList.remove(
      "go"
    );

    void explosionEl.offsetWidth;

    explosionEl.classList.add(
      "go"
    );

    shockEl.classList.remove(
      "go"
    );

    void shockEl.offsetWidth;

    shockEl.classList.add(
      "go"
    );

    spawnBurst();

    statusEl.textContent =
      "SISTEMA SOBRECARREGADO — LIMITE MÁXIMO ULTRAPASSADO";


    setTimeout(() => {

      appEl.classList.remove(
        "megashake"
      );

    }, 900);


    setTimeout(() => {

      gaugeFrame.classList.remove(
        "broken"
      );

      cracksEl.classList.remove(
        "show"
      );

      explosionEl.classList.remove(
        "go"
      );

      glitchEl.classList.remove(
        "go"
      );

      shockEl.classList.remove(
        "go"
      );

      smoothedPct = 0;

      peakPct = 0;

      fillEl.style.height =
        "0%";

      peakEl.style.bottom =
        "0%";

      hasHitOver9000 = false;

      exploding = false;

      statusEl.textContent =
        listening
          ? "SISTEMA REINICIALIZADO — CONTINUE GRITANDO!"
          : "SCANNER PARADO. TOQUE PARA REATIVAR.";

    }, 2600);

  }


  // =========================================================
  // ATUALIZA INTERFACE
  // =========================================================

  function update(pct) {

    if (exploding) {
      return;
    }

    smoothedPct +=
      (pct - smoothedPct) *
      0.35;

    const displayPct =
      Math.max(
        0,
        Math.min(
          100,
          smoothedPct
        )
      );

    fillEl.style.height =
      displayPct + "%";


    const stageIndex =
      currentStageIndex(
        displayPct
      );

    const stage =
      stages[stageIndex];


    fillEl.style.filter =
      `saturate(${
        1 + stageIndex * 0.08
      }) brightness(${
        1 + stageIndex * 0.05
      })`;


    stageNameEl.textContent =
      stage.name;

    stageNameEl.style.color =
      stage.color;

    stageNameEl.style.textShadow =
      `0 0 10px ${stage.color}`;


    legendRows.forEach(
      (row, index) => {

        row.classList.toggle(
          "active",
          index === stageIndex
        );

      }
    );


    const power =
      powerLevelFromPct(
        displayPct
      );


    powerNowEl.textContent =
      power.toLocaleString(
        "pt-BR"
      );

    powerNowEl.style.color =
      stage.color;


    if (
      power > sessionRecord
    ) {

      sessionRecord =
        power;

      powerRecordEl.textContent =
        sessionRecord.toLocaleString(
          "pt-BR"
        );

    }


    // PEAK
    if (
      displayPct >= peakPct
    ) {

      peakPct =
        displayPct;

      peakEl.style.bottom =
        peakPct + "%";

      clearTimeout(
        peakDecayTimer
      );

      peakDecayTimer =
        setTimeout(
          decayPeak,
          900
        );

    }


    // PARTÍCULAS
    stopParticles();

    if (stageIndex >= 1) {

      const rate =
        Math.min(
          6,
          1 + stageIndex
        );

      spawnParticles(
        rate,
        stage.color
      );

    }


    // OVER 9000
    if (power >= 9000) {

      triggerOver9000();

    }


    // SOBRECARGA
    if (displayPct >= 99) {

      triggerScouterBreak();

    }

  }


  // =========================================================
  // DECAY DO PEAK
  // =========================================================

  function decayPeak() {

    peakPct =
      Math.max(
        0,
        peakPct - 2
      );

    peakEl.style.bottom =
      peakPct + "%";


    if (peakPct > 0) {

      peakDecayTimer =
        setTimeout(
          decayPeak,
          140
        );

    }

  }


  // =========================================================
  // LOOP DO MICROFONE
  // =========================================================

  function loop() {

    if (!listening) {
      return;
    }

    analyser.getFloatTimeDomainData(
      dataArray
    );


    let sum = 0;

    for (
      let i = 0;
      i < dataArray.length;
      i++
    ) {

      sum +=
        dataArray[i] *
        dataArray[i];

    }


    const rms =
      Math.sqrt(
        sum / dataArray.length
      );


    const db =
      20 *
      Math.log10(
        rms || 0.00001
      );


    if (
      db > ceilingDb - 2
    ) {

      ceilingDb =
        db + 2;

    }


    const pct =
      dbToPercent(db);

    update(pct);

    rafId =
      requestAnimationFrame(
        loop
      );

  }


  // =========================================================
  // CALIBRAÇÃO
  // =========================================================

  async function calibrateAmbient() {

    statusEl.textContent =
      "CALIBRANDO AMBIENTE — FIQUE EM SILÊNCIO...";

    const samples = [];

    const start =
      performance.now();


    return new Promise(
      resolve => {

        function sample() {

          analyser.getFloatTimeDomainData(
            dataArray
          );


          let sum = 0;

          for (
            let i = 0;
            i < dataArray.length;
            i++
          ) {

            sum +=
              dataArray[i] *
              dataArray[i];

          }


          const rms =
            Math.sqrt(
              sum / dataArray.length
            );


          const db =
            20 *
            Math.log10(
              rms || 0.00001
            );


          samples.push(db);


          if (
            performance.now() -
              start <
            900
          ) {

            requestAnimationFrame(
              sample
            );

          } else {

            const avg =
              samples.reduce(
                (a, b) =>
                  a + b,
                0
              ) /
              samples.length;


            noiseFloor =
              avg;

            ceilingDb =
              Math.max(
                -6,
                avg + 45
              );

            resolve();

          }

        }

        sample();

      }
    );

  }


  // =========================================================
  // INICIAR MICROFONE
  // =========================================================

  async function startListening() {

    try {

      statusEl.textContent =
        "SOLICITANDO ACESSO AO MICROFONE...";


      stream =
        await navigator.mediaDevices.getUserMedia({

          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }

        });


      audioCtx =
        new (
          window.AudioContext ||
          window.webkitAudioContext
        )();


      const source =
        audioCtx.createMediaStreamSource(
          stream
        );


      analyser =
        audioCtx.createAnalyser();

      analyser.fftSize =
        2048;


      dataArray =
        new Float32Array(
          analyser.fftSize
        );


      source.connect(
        analyser
      );


      await calibrateAmbient();


      listening = true;


      startBtn.textContent =
        "PARAR SCANNER";

      startBtn.classList.add(
        "listening"
      );


      statusEl.textContent =
        "PRONTO! GRITE PARA AUMENTAR SEU PODER!";


      hasHitOver9000 = false;


      loop();

    } catch (error) {

      statusEl.textContent =
        "ERRO: PERMISSÃO DE MICROFONE NEGADA OU INDISPONÍVEL";

      console.error(
        "Erro ao acessar microfone:",
        error
      );

    }

  }


  // =========================================================
  // PARAR MICROFONE
  // =========================================================

  function stopListening() {

    listening = false;


    cancelAnimationFrame(
      rafId
    );


    stopParticles();


    if (stream) {

      stream
        .getTracks()
        .forEach(
          track => track.stop()
        );

    }


    if (audioCtx) {

      audioCtx.close();

      audioCtx = null;

    }


    startBtn.textContent =
      "GRITAR AGORA";

    startBtn.classList.remove(
      "listening"
    );


    statusEl.textContent =
      "SCANNER PARADO. TOQUE PARA REATIVAR.";


    smoothedPct = 0;

    peakPct = 0;


    fillEl.style.height =
      "0%";

    peakEl.style.bottom =
      "0%";


    powerNowEl.textContent =
      "0";

    stageNameEl.textContent =
      "FORMA BASE";


    legendRows.forEach(
      (row, index) => {

        row.classList.toggle(
          "active",
          index === 0
        );

      }
    );


    exploding = false;


    gaugeFrame.classList.remove(
      "broken"
    );

    cracksEl.classList.remove(
      "show"
    );

    explosionEl.classList.remove(
      "go"
    );

    glitchEl.classList.remove(
      "go"
    );

    shockEl.classList.remove(
      "go"
    );

  }


  // =========================================================
  // BOTÃO INICIAR / PARAR
  // =========================================================

  startBtn.addEventListener(
    "click",
    () => {

      if (listening) {

        stopListening();

      } else {

        startListening();

      }

    }
  );


  // =========================================================
  // RESETAR RECORDE
  // =========================================================

  resetBtn.addEventListener(
    "click",
    () => {

      sessionRecord = 0;

      powerRecordEl.textContent =
        "0";

    }
  );


  // =========================================================
  // TELA CHEIA
  // =========================================================

  fsBtn.addEventListener(
    "click",
    () => {

      if (
        !document.fullscreenElement
      ) {

        document.documentElement
          .requestFullscreen()
          .catch(() => {});

      } else {

        document.exitFullscreen();

      }

    }
  );


  // =========================================================
  // ESTADO INICIAL
  // =========================================================

  legendRows.forEach(
    (row, index) => {

      row.classList.toggle(
        "active",
        index === 0
      );

    }
  );

})();
