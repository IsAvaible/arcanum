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
        SET "assignees" = ARRAY(SELECT jsonb_array_elements_text("assignee_temp"::jsonb)::text)
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
    return queryInterface.sequelize.transaction(async (t) => {
      // Step 1: Rename the original column to a temporary name
      await queryInterface.renameColumn(
        "Cases",
        "assignees",
        "assignees_temp",
        {
          transaction: t,
        },
      );

      // Step 2: Add the new column with the desired type (JSON)
      await queryInterface.addColumn(
        "Cases",
        "assignee",
        {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
        },
        { transaction: t },
      );

      // Step 3: Migrate data from the old column to the new column
      await queryInterface.sequelize.query(
        `
      UPDATE "Cases"
      SET "assignee" = to_json("assignees_temp")
      WHERE "assignees_temp" IS NOT NULL;
      `,
        { transaction: t },
      );

      // Step 4: Drop the temporary column
      await queryInterface.removeColumn("Cases", "assignees_temp", {
        transaction: t,
      });
    });
  },
};
