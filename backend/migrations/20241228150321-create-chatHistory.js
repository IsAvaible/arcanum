'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('ChatHistory', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            case_id: {
                allowNull: false,
                type: Sequelize.INTEGER,
                references: {
                    model: 'Cases', // Referenziert die Tabelle 'Cases'
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            adjustment_time: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW, // Speichert das Änderungsdatum
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('ChatHistory');
    },
};
