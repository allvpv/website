async function delay(ms) {
  return await new Promise(resolve => setTimeout(resolve, ms));
}

const animate = async (e) => {
  const text = e.getAttribute('data-text');
  const period = (() => {
    const period = parseInt(e.getAttribute('data-period'));
    return isNaN(period) ? 20 : period;
  })();

  let currentText = "";

  while (true) {
    const letter = text[currentText.length];

    if (!letter)
      break;

    currentText += letter;
    e.innerText = currentText;

    await delay(period);
  }
}

const animateAll = async () => {
    const elements = document.querySelectorAll('typewriter-animation');
    for await (let element of elements) {
        await animate(element);
    }
}

window.onload = () => animateAll();
