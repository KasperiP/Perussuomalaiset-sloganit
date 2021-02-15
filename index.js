const puppeteer = require('puppeteer');
const fs = require('fs');
const writeStream = fs.createWriteStream('file.txt');
const pathName = writeStream.path;

const scrape = async () => {
	let baseUrl = 'https://vaalit.perussuomalaiset.fi/kuntavaalit';

	const browser = await puppeteer.launch({ headless: true });
	let page = await browser.newPage();

	await page.goto(baseUrl);

	const allLinks = await page.evaluate(() => {
		return Array.from(document.getElementsByTagName('a'), (a) => a.href);
	});
	const alueet = allLinks.filter((link) =>
		link.includes('vaalit.perussuomalaiset.fi/kuntavaalit/alue')
	);

	let ehdokkaatPre = [];
	for (let x = 0; x < alueet.length; x++) {
		const pageToSearch = alueet[x];
		await page.goto(pageToSearch);
		console.log(
			`\u001b[36mKäydään läpi alueet: (${x}/${alueet.length}) ${alueet[x]
				.replace(
					'https://vaalit.perussuomalaiset.fi/kuntavaalit/alue/',
					''
				)
				.trim()}`
		);
		const ehdokasAllLinks = await page.evaluate(() => {
			return Array.from(
				document.getElementsByTagName('a'),
				(a) => a.href
			);
		});
		let data = ehdokasAllLinks.filter((link) =>
			link.includes('vaalit.perussuomalaiset.fi/kuntavaalit/ehdokas')
		);
		ehdokkaatPre.push(data);
	}
	const ehdokkaat = [].concat.apply([], ehdokkaatPre);

	let slogans = [];
	for (let f = 0; f < ehdokkaat.length; f++) {
		const pageToSearch = ehdokkaat[f];
		console.log(
			`\u001b[36mKäydään läpi ehdokkaat: (${f}/${
				ehdokkaat.length
			}) ${ehdokkaat[f]
				.replace(
					'https://vaalit.perussuomalaiset.fi/kuntavaalit/ehdokas/',
					''
				)
				.trim()}`
		);
		await page.goto(pageToSearch);
		let data = await page.evaluate(() => {
			let slogan = document.querySelector('div[class=slogan]');
			if (slogan) {
				return slogan.innerText;
			}
		});
		slogans.push(data);
	}
	let slogansFinal = slogans.filter(Boolean);
	slogansFinal.forEach((value) => writeStream.write(`${value}\n`));
	writeStream.on('finish', () => {
		console.log(
			`Valmista! Kaikki sloganit kirjoitettu tiedostoon ${pathName}`
		);
	});
	writeStream.on('error', (err) => {
		console.error(
			`Odottamaton virhe tapahtui kirjoittaessa tietoja ${pathName}-tiedostoon => ${err}`
		);
	});
	writeStream.end();
};
scrape();
