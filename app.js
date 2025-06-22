class ParticleSystem {
  constructor() {
    this.container = document.getElementById("particles")
    this.particles = []
    this.maxParticles = 50
    this.init()
  }

  init() {
    this.createParticles()
    this.animate()
  }

  createParticles() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.createParticle()
    }
  }

  createParticle() {
    const particle = document.createElement("div")
    particle.className = "particle"

    const size = Math.random() * 4 + 2
    const x = Math.random() * window.innerWidth
    const y = Math.random() * window.innerHeight
    const opacity = Math.random() * 0.5 + 0.1
    const duration = Math.random() * 4 + 4

    particle.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      opacity: ${opacity};
      animation-duration: ${duration}s;
      animation-delay: ${Math.random() * 2}s;
    `

    this.container.appendChild(particle)
    this.particles.push({
      element: particle,
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: size,
    })
  }

  animate() {
    this.particles.forEach((particle) => {
      particle.x += particle.vx
      particle.y += particle.vy

      if (particle.x < 0 || particle.x > window.innerWidth) particle.vx *= -1
      if (particle.y < 0 || particle.y > window.innerHeight) particle.vy *= -1

      particle.element.style.left = particle.x + "px"
      particle.element.style.top = particle.y + "px"
    })

    requestAnimationFrame(() => this.animate())
  }
}

class PaymentGateway {
  constructor() {
    this.initElements()
    this.initTheme()
    this.bindEvents()
    this.particleSystem = new ParticleSystem()
    this.paymentStatus = {
      dana: "ready",
      gopay: "ready",
      ovo: "not-ready",
    }
  }

  initElements() {
    this.themeToggle = document.querySelector(".theme-toggle")
    this.openButton = document.getElementById("openPaymentSlide")
    this.closeButton = document.getElementById("closePaymentSlide")
    this.paymentSlide = document.getElementById("paymentSlide")
    this.copyButtons = document.querySelectorAll(".copy-button")
    this.downloadButton = document.getElementById("downloadQris")
    this.toast = document.getElementById("toast")
    this.statusToggles = document.querySelectorAll(".status-toggle")
  }

  initTheme() {
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme)
    } else if (prefersDark) {
      document.documentElement.setAttribute("data-theme", "dark")
    } else {
      document.documentElement.setAttribute("data-theme", "light")
    }
  }

  bindEvents() {
    this.themeToggle.addEventListener("click", () => this.toggleTheme())
    this.openButton.addEventListener("click", () => this.showPaymentSlide())
    this.closeButton.addEventListener("click", () => this.hidePaymentSlide())

    this.copyButtons.forEach((button) => {
      button.addEventListener("click", (e) => this.handleCopy(e))
    })

    this.downloadButton.addEventListener("click", () => this.downloadQRIS())

    this.statusToggles.forEach((toggle) => {
      toggle.addEventListener("click", (e) => this.togglePaymentStatus(e))
    })

    this.paymentSlide.addEventListener("click", (e) => {
      if (e.target === this.paymentSlide) {
        this.hidePaymentSlide()
      }
    })

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.paymentSlide.classList.contains("active")) {
        this.hidePaymentSlide()
      }
    })

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      if (!localStorage.getItem("theme")) {
        document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light")
      }
    })
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme")
    const newTheme = currentTheme === "dark" ? "light" : "dark"

    document.documentElement.setAttribute("data-theme", newTheme)
    localStorage.setItem("theme", newTheme)

    this.themeToggle.style.transform = "scale(0.9)"
    setTimeout(() => {
      this.themeToggle.style.transform = "scale(1)"
    }, 150)
  }

  showPaymentSlide() {
    this.paymentSlide.classList.add("active")
    document.body.style.overflow = "hidden"

    // Play gateway sound
    const audio = document.getElementById("gatewayAudio")
    if (audio) {
      audio.currentTime = 0
      audio.play().catch((e) => {
        console.log("Audio play failed:", e)
      })
    }

    const cards = this.paymentSlide.querySelectorAll(".payment-card, .qris-card")
    cards.forEach((card, index) => {
      card.style.animationDelay = `${index * 0.1}s`
      card.style.animation = "slideInRight 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards"
    })
  }

  hidePaymentSlide() {
    this.paymentSlide.classList.remove("active")
    document.body.style.overflow = ""
  }

  togglePaymentStatus(event) {
    const button = event.currentTarget
    const method = button.getAttribute("data-method")
    const card = button.closest(".payment-card")
    const statusIndicator = button.querySelector(".status-indicator")
    const statusText = button.querySelector(".status-text")
    const copyButton = card.querySelector(".copy-button")

    const currentStatus = this.paymentStatus[method]
    const newStatus = currentStatus === "ready" ? "not-ready" : "ready"

    this.paymentStatus[method] = newStatus
    card.setAttribute("data-status", newStatus)

    statusIndicator.className = `status-indicator ${newStatus}`
    statusText.textContent = newStatus === "ready" ? "Ready" : "Not Ready"

    if (newStatus === "ready") {
      copyButton.disabled = false
    } else {
      copyButton.disabled = true
    }

    this.animateButton(button, newStatus === "ready" ? "success" : "warning")
    this.showToast("Status Updated!", `${method.toUpperCase()} is now ${newStatus === "ready" ? "ready" : "not ready"}`)
  }

  async handleCopy(event) {
    const button = event.currentTarget
    const textToCopy = button.getAttribute("data-copy")
    const paymentMethod = button.closest(".payment-card").querySelector(".brand-name").textContent

    if (button.disabled) {
      this.showToast("Not Available", `${paymentMethod} is currently not ready`)
      return
    }

    try {
      await navigator.clipboard.writeText(textToCopy)
      this.showToast("Success!", `${paymentMethod} number copied to clipboard`)
      this.animateButton(button, "success")
    } catch (err) {
      const textArea = document.createElement("textarea")
      textArea.value = textToCopy
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      this.showToast("Success!", `${paymentMethod} number copied to clipboard`)
      this.animateButton(button, "success")
    }
  }

  downloadQRIS() {
    const qrImage = document.querySelector(".qr-image")
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const link = document.createElement("a")
      link.download = "qris-payment.jpg"
      link.href = canvas.toDataURL("image/jpeg", 0.9)
      link.click()

      this.showToast("Downloaded!", "QRIS code saved to your device")
      this.animateButton(this.downloadButton, "success")
    }

    img.src = qrImage.src
  }

  showToast(title, message) {
    const toastTitle = this.toast.querySelector(".toast-title")
    const toastMessage = this.toast.querySelector(".toast-message")

    toastTitle.textContent = title
    toastMessage.textContent = message

    this.toast.classList.add("show")

    setTimeout(() => {
      this.toast.classList.remove("show")
    }, 4000)
  }

  animateButton(button, type) {
    const originalBg = button.style.background
    let color

    switch (type) {
      case "success":
        color = "#10b981"
        break
      case "warning":
        color = "#f59e0b"
        break
      default:
        color = "#ef4444"
    }

    button.style.background = color
    button.style.transform = "scale(1.1)"

    setTimeout(() => {
      button.style.background = originalBg
      button.style.transform = "scale(1)"
    }, 300)
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new PaymentGateway()
})

window.addEventListener("resize", () => {
  const particles = document.querySelectorAll(".particle")
  particles.forEach((particle) => {
    const x = Math.random() * window.innerWidth
    const y = Math.random() * window.innerHeight
    particle.style.left = x + "px"
    particle.style.top = y + "px"
  })
})
