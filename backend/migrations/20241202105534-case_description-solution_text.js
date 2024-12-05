'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Cases', 'description', {
      allowNull: false,
      type: Sequelize.TEXT
    });
    await queryInterface.changeColumn('Cases', 'solution', {
      allowNull: true,
      type: Sequelize.TEXT
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Cases', 'description', {
      allowNull: false,
      type: Sequelize.STRING
    });
    await queryInterface.changeColumn('Cases', 'solution', {
      allowNull: true,
      type: Sequelize.STRING
    });
  }
};
