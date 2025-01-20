"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (t) => {
      // Step 1: Rename the original column to a temporary name
      await queryInterface.renameColumn("Cases", "assignee", "assignee_temp", {
        transaction: t,
      });

      // Step 2: Add the new column with the desired type (ARRAY of STRING)
      await queryInterface.addColumn(
        "Cases",
        "assignees",
        {
          type: Sequelize.ARRAY(Sequelize.STRING),
          allowNull: false,
          defaultValue: [],
        },
        { transaction: t },
      );

      // Step 3: Migrate data from the old column to the new column
      await queryInterface.sequelize.query(
        `
        UPDATE "Cases"
        SET "assignees" = ARRAY["assignee_temp"]
        WHERE "assignee_temp" IS NOT NULL;
        `,
        { transaction: t },
      );

      // Step 4: Drop the temporary column
      await queryInterface.removeColumn("Cases", "assignee_temp", {
        transaction: t,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction((t) => {
      return queryInterface
        .renameColumn("Cases", "assignees", "assignee", {
          transaction: t,
        })
        .then(() =>
          queryInterface.changeColumn(
            "Cases",
            "assignee",
            {
              allowNull: true,
              defaultValue: null,
              type: Sequelize.JSON,
            },
            { transaction: t },
          ),
        );
    });
  },
};
