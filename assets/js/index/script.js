import { doodleSVG } from "../../js/index/doodle.js";
document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";
  const settings = {
    lensImageURL: "./assets/images/8.jpg",
    glaresPerLens: 2,
    finalZoomScale: 22,
    zoomFocusPoint: "47% 21%",
  };

  document.querySelector(".svg-container").innerHTML = doodleSVG;

  const svg = document.querySelector("svg");
  const defs = document.createElementNS(SVG_NAMESPACE, "defs");
  svg.insertBefore(defs, svg.firstChild);

  const glareBands = [];
  const lensImages = [];
  const glarePaths = [...svg.querySelectorAll("path")].filter((path) => {
    return parseFloat(getComputedStyle(path).opacity) === 0.6;
  });

  glarePaths.forEach((glarePath, lensIndex) => {
    const lensShape = glarePath.previousElementSibling;
    if (!lensShape) return;

    const lensBounds = lensShape.getBBox();

    const clipId = `lens-clip-${lensIndex}`;
    const clipPath = document.createElementNS(SVG_NAMESPACE, "clipPath");
    clipPath.setAttribute("id", clipId);
    clipPath.appendChild(lensShape.cloneNode(true));
    defs.appendChild(clipPath);

    const lensGroup = document.createElementNS(SVG_NAMESPACE, "g");
    lensGroup.setAttribute("clip-path", `url(#${clipId})`);

    const lensImage = document.createElementNS(SVG_NAMESPACE, "image");
    lensImage.setAttribute("href", settings.lensImageURL);
    lensImage.setAttributeNS(
      XLINK_NAMESPACE,
      "xlink:href",
      settings.lensImageURL,
    );

    lensImage.setAttribute("x", lensBounds.x);
    lensImage.setAttribute("y", lensBounds.y);
    lensImage.setAttribute("width", lensBounds.width);
    lensImage.setAttribute("height", lensBounds.height);
    lensImage.setAttribute("preserveAspectRatio", "xMidYMid slice");
    lensImage.setAttribute("opacity", "0");

    lensGroup.appendChild(lensImage);
    lensImages.push(lensImage);

    const bandWidth = lensBounds.width * 0.22;
    const sweepDistance = lensBounds.width + bandWidth * 2;
    const spacingBetweenBands = sweepDistance / settings.glaresPerLens;
    for (let i = 0; i < settings.glaresPerLens; i++) {
      const band = document.createElementNS(SVG_NAMESPACE, "rect");

      band.setAttribute(
        "x",
        lensBounds.x + lensBounds.width * 0.3 - i * spacingBetweenBands,
      );
      band.setAttribute("y", lensBounds.y - lensBounds.height * 0.25);
      band.setAttribute("width", bandWidth);
      band.setAttribute("height", lensBounds.height * 1.5);
      band.setAttribute("fill", "#ffffff");
      band.setAttribute("opacity", "0.6");

      lensGroup.appendChild(band);
      glareBands.push({ band, sweepDistance });
    }

    glarePath.parentNode.insertBefore(lensGroup, glarePath);
    glarePath.remove();
  });

  const spotlightHeader = document.querySelector(".spotlight-header h1");
  let headerSplit = null;

  if (spotlightHeader) {
    headerSplit = new SplitText(spotlightHeader, {
      type: "lines",
      linesClass: "spotlight-line",
      mask: "lines",
    });
    gsap.set(headerSplit.lines, { opacity: 0, y: 20 });
  }

  gsap.set(svg, {
    transformOrigin: settings.zoomFocusPoint,
    transformBox: "fill-box",
  });

  const spotlightSection = document.querySelector(".spotlight");
  ScrollTrigger.create({
    trigger: spotlightSection,
    start: "top top",
    end: () => "+=" + window.innerHeight * 3,
    pin: true,
    pinSpacing: true,
    scrub: true,
    // markers: true,
    onUpdate: (self) => {
      const progress = self.progress;
      const glareProgress = Math.min(progress / 0.75, 1);

      glareBands.forEach(({ band, sweepDistance }) => {
        gsap.set(band, {
          x: glareProgress * sweepDistance,
        });
      });
      const scale = 1 + progress * 2 * (settings.finalZoomScale - 1);
      gsap.set(svg, { scale });

      if (progress >= 0.5) {
        const fadeProgress = (progress - 0.5) / 0.5;
        lensImages.forEach((image) => {
          gsap.set(image, {
            opacity: fadeProgress,
          });
        });
      } else {
        lensImages.forEach((image) => {
          gsap.set(image, {
            opacity: 0,
          });
        });
      }

      if (headerSplit && headerSplit.lines.length > 0) {
        if (progress >= 0.65 && progress <= 0.85) {
          const textProgress = (progress - 0.65) / 0.2;
          const totalLines = headerSplit.lines.length;

          headerSplit.lines.forEach((line, index) => {
            const lineRevealProgress = index / totalLines;

            if (textProgress >= lineRevealProgress) {
              gsap.to(line, {
                opacity: 1,
                y: 0,
                duration: 0.4,
                ease: "power2.out",
              });
            } else {
              gsap.set(line, { opacity: 0, y: 20 });
            }
          });
        } else if (progress < 0.65) {
          gsap.set(headerSplit.lines, { opacity: 0, y: 20 });
        } else if (progress > 0.85) {
          gsap.set(headerSplit.lines, { opacity: 1, y: 0 });
        }
      }
    },
  });
});
