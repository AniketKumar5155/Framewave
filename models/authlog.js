'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class AuthLog extends Model {
    static associate(models) {
      AuthLog.belongsTo(models.User, {
        foreignKey: 'user_id',
        onDelete: 'CASCADE',
      });
    }
  }

  AuthLog.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'AuthLog',
      tableName: 'auth_logs',
      underscored: true,
      timestamps: false,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['action'] },
        { fields: ['created_at'] },
      ],
    }
  );

  return AuthLog;
};
