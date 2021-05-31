const express = require('express');
const router = express.Router();
const Busboy = require('busboy');
const aws = require('../services/aws');
const Especialidade = require('../models/especialidade');
const Arquivo = require('../models/arquivo');


//POST

router.post('/', async (req, res) => {
  let busboy = new Busboy({ headers: req.headers });
  busboy.on('finish', async () => {
    try {
      const {clinicaId, especialidade} = req.body
      let errors = [];
      let arquivos = [];


          //Looping para chamada dos arquivos para upload no AWS.

      if (req.files && Object.keys(req.files).length > 0) {
        for (let key of Object.keys(req.files)) {
          
            const file = req.files[key];
          
          //Criação do nome do arquivo, horario de upload em milisegundos e a
          //extensão final do arquivo.

            const nameParts = file.name.split('.');
          const fileName = `${new Date().getTime()}.${
            nameParts[nameParts.length - 1]
          }`;

          //Criando para o Bucket na AWS
          const path = `especialidade/${clinicaId}/${fileName}`;

          //Efetuado o Upload dos arquivos na AWS
          const response = await aws.uploadToS3(file, path);

          if (response.error) {
            errors.push({ error: true, message: response.message });
          } else {
            arquivos.push(path);
          }
        }
      }

      if (errors.length > 0) {
        res.json(errors[0]);
        return false;
      }

      // Criação da Especialidade
      let jsonEspecialidade = JSON.parse(especialidade);
      const especialidadeCadastrada = await Especialidade(jsonEspecialidade).save();

      // Criação do Arquivo
      arquivos = arquivos.map((arquivo) => ({
        referenciaId: especialidadeCadastrada._id,
        model: 'Especialidade',
        caminho: arquivo,
      }));
      
      //Inserção de vários arquivos
      await Arquivo.insertMany(arquivos);

      res.json({ especialidade: especialidadeCadastrada, arquivos });
    } catch (err) {
      res.json({ error: true, message: err.message });
    }
  });
  req.pipe(busboy);
});

//PUT

router.put('/:id', async (req, res) => {
  let busboy = new Busboy({ headers: req.headers });
  busboy.on('finish', async () => {
    try {
      const {clinicaId, especialidade} = req.body
      let errors = [];
      let arquivos = [];


              //Looping para chamada dos arquivos para upload no AWS.

      if (req.files && Object.keys(req.files).length > 0) {
        for (let key of Object.keys(req.files)) {
          
            const file = req.files[key];
          
          //Criação do nome do arquivo, horario de upload em milisegundos e a
          //extensão final do arquivo.

            const nameParts = file.name.split('.');
          const fileName = `${new Date().getTime()}.${
            nameParts[nameParts.length - 1]
          }`;

          //Criando para o Bucket na AWS
          const path = `especialidade/${clinicaId}/${fileName}`;

          //Efetuado o Upload dos arquivos na AWS
          const response = await aws.uploadToS3(file, path);

          if (response.error) {
            errors.push({ error: true, message: response.message });
          } else {
            arquivos.push(path);
          }
        }
      }

      if (errors.length > 0) {
        res.json(errors[0]);
        return false;
      }

      // Criação da Especialidade
      const jsonEspecialidade = JSON.parse(especialidade)
      await Especialidade.findByIdAndUpdate(req.params.id, jsonEspecialidade);

      // Criação do Arquivo
      arquivos = arquivos.map((arquivo) => ({
        referenciaId: req.params.id,
        model: 'Especialidade',
        caminho: arquivo,
      }));
      
      //Inserção de vários arquivos
      await Arquivo.insertMany(arquivos);

      res.json({ error: false });
    } catch (err) {
      res.json({ error: true, message: err.message });
    }
  });
  req.pipe(busboy);
});

//POST - DELETE - ARQUIVO

router.post('/delete-arquivo', async (req,res) => {
  try {
    const { id } = req.body;

    //excluir aws
    await aws.deleteFileS3(id);

    await Arquivo.findOneAndDelete({
      caminho: id,
    });

    res.json({error: false})
  }catch(err){
    res.json({ error: true, message: err.message });
  }

})

//DELETE

router.delete('/:id', async (req, res) => {
  try {

    const { id } = req.params;
    await Especialidade.findByIdAndUpdate(id, { status: 'E' });
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

//Rota para o Sistema WEB
//GET

router.get('/clinica/:clinicaId', async (req, res) => {
  try {
    let especialidadesClinica = [];
    const especialidades = await Especialidade.find({
      clinicaId: req.params.clinicaId,
      status: { $ne: 'E' },
    });

    for (let especialidade of especialidades) {
      const arquivos = await Arquivo.find({
        model: 'Especialidade',
        referenciaId: especialidade._id,
      });
      
      especialidadesClinica.push ({ ... especialidade._doc, arquivos });
      
    }
    
    res.json({
      error: false,
      especialidades: especialidadesClinica,
    });

  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});


module.exports = router;
