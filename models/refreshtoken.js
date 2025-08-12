'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class RefreshToken extends Model {
    static associate(models) {
      RefreshToken.belongsTo(models.User, {
        foreignKey: 'user_id',
        onDelete: 'CASCADE',
      });
    }
  }

  RefreshToken.init(
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
      token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      is_valid: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
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

      rotated_from: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      revoked_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      last_used: {
        type: DataTypes.DATE,
        allowNull: false,
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
      modelName: 'RefreshToken',
      tableName: 'refresh_tokens',
      underscored: true,
      timestamps: false,
      indexes: [
        { fields: ['token'] },
        { fields: ['user_id'] },
        { fields: ['is_valid'] },
        { fields: ['expires_at'] },
      ],
    }
  );

  return RefreshToken;
};
