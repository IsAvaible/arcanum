'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Cases', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        allowNull: false,
        type: Sequelize.STRING
      },
      description: {
        allowNull: false,
        type: Sequelize.STRING
      },
      solution: {
        allowNull: true,
        type: Sequelize.STRING
      },
      assignee: {
        allowNull: true,
        type: Sequelize.STRING
      },
      status: {
        allowNull: true,
        type: Sequelize.STRING
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      case_type: {
        allowNull: true,
        type: Sequelize.STRING
      },
      priority: {
        allowNull: true,
        type: Sequelize.STRING
      },
      draft: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false
      }
    });

    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down (queryInterface, Sequelize) {

    await queryInterface.dropTable('Cases');
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
