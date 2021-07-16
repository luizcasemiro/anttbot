console.log("ANTT Bot")

var myArgs = process.argv.slice(2);
if(myArgs[0] == null && myArgs[1] == null){ console.log("argumentos necessarios")
process.exit()
}else{

const puppeteer = require('puppeteer');
const fs = require('fs');
var json2xls = require('json2xls');

const startUrl = "https://consultapublica.antt.gov.br/Site/ConsultaRNTRC.aspx";

var data = [];
var info = { cidade: "", estado: "" };

(async () => {
    var conteudo = [];
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(startUrl);
    console.log("Acessando Site")
    await page.evaluate(() => {
        var test = document.querySelector('input[id="Corpo_rbTipoConsulta_1"]')
         test.click();
     })
     await page.waitForSelector('option[value="ETC"]')
     await page.waitForTimeout(1000);
     await page.select("#Corpo_ddlTipo", "ETC")
     console.log("Selecionando Categoria")
     await page.waitForTimeout(1000);
     await page.select("#Corpo_ddlUF", myArgs[0])
     console.log("Selecionando Estado")
     await page.waitForTimeout(1000);
     await page.select("#Corpo_ddlMunicipio", myArgs[1])
     console.log("Selecionando Municipio")
     await page.waitForTimeout(1000);
     await page.click("#Corpo_btnConsulta")
     await page.waitForResponse("https://consultapublica.antt.gov.br/Site/ConsultaRNTRC.aspx")
     await page.waitForTimeout(1000);
     const quantidade = await page.evaluate(() => {
        var registros = document.querySelector('#Corpo_lblQtdRegistros')
        return registros.innerText.split('de')[1].split(" ")[1]
     })
     info.cidade = await page.$eval("#Corpo_ddlUF", selectedValue=> selectedValue.value)
     info.estado = await page.evaluate(() => {
        var registros = document.querySelector('#Corpo_ddlMunicipio > option[selected="selected"]')
        return registros.innerText
     })
     //const cidade = await page.evaluate(() => document.querySelector('#Corpo_ddlMunicipio > option[selected="selected"]').innerText)
     // await page.$eval(`#Corpo_ddlMunicipio > option[selected="selected"]`)
    //  const cidade = await page.evaluate(() => {option:nth-child(32)
    //     var registro = document.querySelector(`option[value=${numcidade}]`)
    //     return registro
    //  })

     console.log(info)
     paginas = Math.ceil(quantidade / 10)
     console.log(`${quantidade} registros encontrados em ${paginas} paginas`)
     
     data = await getContent(1)

     for (var i = 1; i < paginas; i++) {
        
        await page.waitForTimeout(1000);
        await page.click("#Corpo_ucPaginatorConsultaPesquisa_ucPaginatorConsultaPesquisa_lbNextPage")
        await page.waitForResponse("https://consultapublica.antt.gov.br/Site/ConsultaRNTRC.aspx")
        let content = await getContent(i+1)
        data.push(...content)
     }
    // const content = await getContent(i)
    // data = [...content]
     await page.waitForTimeout(1500);
     console.log(conteudo)
     // Corpo_lblQtdRegistros


     async function getContent(pagina){
        console.log(`Carregando dados da pagina ${pagina}`)
        const recipes = await page.$$eval("#Corpo_gvResultadoPesquisa > tbody > tr", (nodes, info) => {
            return nodes.map((node, info) => {
                const nome = node.children[0].innerText
                const rntrc = node.children[1].innerText
                const cadastro_desde = node.children[2].innerText
                const validade = node.children[3].innerText
                const situacao = node.children[4].innerText
                const item = {
                    nome,
                    rntrc,
                    cadastro_desde,
                    validade,
                    situacao,
                
                }

                if (nome != "Transportador") {
                    return item;
                }
            })
        })
        return recipes;
    }
    
    async function getContent2(pagina){
        console.log(`Carregando dados da pagina ${pagina}`)
        var result = await page.evaluate(() => {
            const rows = document.querySelectorAll('#Corpo_gvResultadoPesquisa > tbody > tr');
            return Array.from(rows, row => {
            const columns = row.querySelectorAll('td');
            return Array.from(columns, column => column.innerText);
            });
        });
        result.shift();
        console.log(result)
        return result
    }

    // var click = 
    // console.log(click);

    // while(have != null){
        console.log("Gravando arquivo")
        var filtered = data.filter( item => item != null);
        var final = filtered.map(obj=> ({ ...obj, cidade: info.cidade, estado: info.estado}))

        var xls = json2xls(final);

        fs.writeFileSync('data.xlsx', xls, 'binary');

        fs.writeFile('newCustomer.json', JSON.stringify(final, null, 4), err => {
            if (err) {
                console.log('Error writing file', err)
            } else {
                console.log('Successfully wrote file')
            }
        })

    console.log(`Dados carregados: ${data.length} linhas`)

    
     // #Corpo_gvResultadoPesquisa > tbody > tr:nth-child(2)

     // NEXT = #Corpo_ucPaginatorConsultaPesquisa_ucPaginatorConsultaPesquisa_lbNextPage

     // #Corpo_btnConsulta
     /// #Corpo_ddlUF

     // #Corpo_ddlMunicipio 6094

    //  await page.evaluate(() => {
        
    //     var test = document.querySelector('#Corpo_ddlTipo')
    //     console.log(test)
    //      test.click();
    //  })
    //await page.select('select[name="ctl00$Corpo$ddlTipo"]#first', "ETC");
    // ctl00$Corpo$ddlTipo

    // await browser.close();
  })();
}