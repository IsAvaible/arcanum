"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn("ChangeHistory", "case_id", "caseId");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn("ChangeHistory", "case_id", "caseId");
  },
};
