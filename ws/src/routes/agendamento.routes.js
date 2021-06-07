const express = require('express');
const router = express.Router();
const Agendamento = require('../models/agendamento');
const Cliente = require('../models/cliente');
const Clinica = require('../models/clinica');
const Profissional = require('../models/profissional');
const Especialidade = require('../models/especialidade');
const Horario = require('../models/horario');

const moment = require('moment');
const mongoose = require('mongoose');
const _ = require('lodash');

const pagarme = require('../services/pagarme');
const keys = require('../data/keys.json');
const util = require('../util');
const { json } = require('express');



//POST
router.post('/', async (req, res) => {
  const db = mongoose.connection;
  const session = await db.startSession();
  session.startTransaction();

  try {
    const { clienteId, clinicaId, especialidadeId, profissionalId } = req.body;

  
    //Recuperar o cliente

    const cliente = await Cliente.findById(clienteId).select(
      'nome endereco customerId'
    );

    //Recuperar a Clinica
    const clinica = await Clinica.findById(clinicaId).select('recipientId');

    //Recuperar a especialidade
    const especialidade = await Especialidade.findById(especialidadeId).select(
      'preco titulo honorario'
    );

    //Recuperar o profissional
    const profissional = await Profissional.findById(profissionalId).select(
      'recipientId'
    );
  
    

    //Criando o pagamento
    const precoFinal = util.toCents(especialidade.preco) * 100;


    //Profissional Split
     const profissionalSplitRule = {
        recipient_id: profissional.recipientId,
        amount: parseInt(precoFinal * (especialidade.honorario / 100)),
      };


    const createPayment = await pagarme('/transactions', {


      amount: precoFinal,

      //Dados do Cartão
      card_number: '4111111111111111',
      card_cvv: '123',
      card_expiration_date: '0922',
      card_holder_name: 'Morpheus Fishburne',
      
      
      //Dados do Cliente
      customer: {
        id: cliente.customerId,
      },
      billing: {
        name: cliente.nome,
        address: {
          country: cliente.endereco.pais,
          state: cliente.endereco.uf,
          city: cliente.endereco.cidade,
          street: cliente.endereco.logradouro,
          street_number: cliente.endereco.numero,
          zipcode: cliente.endereco.cep,
        },
      },
      items: [
        {
          id: especialidadeId,
          title: especialidade.titulo,
          unit_price: precoFinal,
          quantity: 1,
          tangible: false,
        },
      ],
      split_rules: [

        //Honorarios da Clinica
        {
          recipient_id: clinica.recipientId,
          amount: precoFinal -  keys.app_fee - profissionalSplitRule.amount,
        },
        
        //Honorarios do Profissional

        profissionalSplitRule,
        
        //Honorarios do Profissional
        {
          recipient_id: keys.recipient_id,
          amount: keys.app_fee,
        },
      ],
    });

    if(createPayment.error){
      throw createPayment;
    }

  //Crianção do Agendamento

  const agendamento = await new Agendamento({
    ...req.body,
    transactionId: createPayment.data.id,
    honorario: especialidade.honorario,
    valor: especialidade.preco
  }).save({session})


  await session.commitTransaction();
  session.endSession();

    res.json({ error: false, agendamento});
  }catch(err){
    await session.abortTransaction();
    session.endSession();
    res.json({ error: true, message: err.message });
  }
});

//POST - Filtrar todos os agendamentos de uma clinica

router.post('/filter', async (req, res) =>{

  try {

    const {periodo, clinicaId } = req.body;

    const agendamentos = await Agendamento.find({
      clinicaId,
      data: {
        $gte: moment(periodo.inicio).startOf('day'),
        $lte: moment(periodo.final).endOf('day'),
      },
    }).populate([
      { path: ' especialidadeId', select: 'titulo duracao' },
      { path: 'profissionalId', select: 'nome' },
      { path: 'clienteId', select: 'nome' },
    ]);

    res.json({ error: false, agendamentos });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

//POST - Disponibilidade

router.post('/dias-disponiveis', async (req, res) => {
  try {

    const { data, clinicaId, especialidadeId } = req.body;
    const horarios = await Horario.find({ clinicaId });
    const especialidade = await Especialidade.findById(especialidadeId).select('duracao');
    let profissionais = [];

    let agenda = [];
    let lastDay = moment(data);

    // Duração da Especialidade

    const especialidadeMinutos = util.hourToMinutes(
      moment(especialidade.duracao).format('HH:mm')
    );

    // Criação de Slots de tempo/duração.

    const especialidadeSlots = util.sliceMinutes(
      especialidade.duracao,
      moment(especialidade.duracao).add(especialidadeMinutos, 'minutes'),
      util.SLOT_DURATION,
    ).length;

    for (let i = 0; i <= 365 && agenda.length <= 7; i++) {
      const espacosValidos = horarios.filter((h) => {
       
        // Verificar o dia da Semana

        const diaSemanaDisponivel = h.dias.includes(moment(lastDay).day());

        // Verificar especialidade disponiveis

        const especialidadesDisponiveis = h.especialidades.includes(especialidadeId);

        return diaSemanaDisponivel && especialidadesDisponiveis;
      });

      if (espacosValidos.length > 0) {

        let todosHorariosDia = {};
        for (let espaco of espacosValidos) {
          for (let profissionalId of espaco.profissionais) {
            if (!todosHorariosDia[profissionalId]) {
              todosHorariosDia[profissionalId] = []
            }
            todosHorariosDia[profissionalId] = [
              ...todosHorariosDia[profissionalId],
              ...util.sliceMinutes(
                util.mergeDateTime(lastDay, espaco.inicio),
                util.mergeDateTime(lastDay, espaco.fim),
                util.SLOT_DURATION
              ),
            ];
          }
        }

        for(let profissionalId of Object.keys(todosHorariosDia)) {

          // Recuperar Agendamentos
          console.log(profissionalId);
          console.log(lastDay.format('DD/MM/YYYY'));

          const agendamentos = await Agendamento.find({
            profissionalId,
            data: {
              $gte: moment(lastDay).startOf('day'),
              $lte: moment(lastDay).endOf('day'),

            },
          })
          .select ('data especialidadeId -_id')
          .populate('especialidadeId', 'duracao');
        
          //Recuperar horarios agendados

          let horariosOcupado = agendamentos.map((agendamento) => ({
            inicio: moment(agendamento.data),
            fim: moment(agendamento.data).add(
              util.hourToMinutes(
              moment(agendamento.especialidadeId.duracao).format('HH:mm')
            ), 
            'minutes'
            ),
   
          }));

         //Verificar os horarios ocupados

        horariosOcupados = horariosOcupado.map((h) =>
         util.sliceMinutes(h.inicio, h.fim, util.SLOT_DURATION)
       ).flat();

      let horariosLivres = util.splitByValue(todosHorariosDia[profissionalId].map(
         (hLivre) => {
        return horariosOcupados.includes(hLivre) 
        ? '-'
        : hLivre;

      }
      
      ), '-'
      ).filter((space) => space.length > 0);

        //Verificando se existe espaço suficiente na agenda
      horariosLivres = horariosLivres.filter((h) => h.length >= especialidadeSlots
        );

        //Verificando se os horarios dentro do slot tem a quantidade necessaria

        horariosLivres = horariosLivres.map((slot) =>
            slot.filter(
              (horario, index) => slot.length - index >= especialidadeSlots
            )
          ).flat();

          // Efeutando a divisao dos horarios em duplas para ficar de acordo com o design da interface

          horariosLivres = _.chunk(horariosLivres, 2); 

          if(horariosLivres.length === 0) {

            todosHorariosDia = _.omit(todosHorariosDia, profissionalId);
          } else {
            todosHorariosDia[profissionalId] = horariosLivres;
          }
         }

          // Verificando se há profissional para aquele dia na agenda
          const totalProfissionais = Object.keys(todosHorariosDia).length;

          if (totalProfissionais > 0) {
           profissionais.push(Object.keys(todosHorariosDia));
           agenda.push({
              [lastDay.format('YYYY-MM-DD')]: todosHorariosDia,
            });
          }
      
    }
      lastDay = moment(lastDay).add(1, 'day');
    }

    profissionais = await Profissional.find({
      _id: { $in: _.uniq(profissionais.flat()) },
    }).select('nome foto');
  
    profissionais = profissionais.map(p => ({
      ...p._doc,
      nome: p.nome.split(' ')[0],
    }));

    profissionais = _.uniq(profissionais.flat());

  res.json({error: false, 
    profissionais,
    agenda,
  });

    }  catch (err) {
      res.json({error: true, message: err.message});
    }
});


module.exports = router;