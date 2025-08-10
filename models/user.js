const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class User extends Model {
        static associate(models) {

            User.hasMany(models.RefreshToken, {
                foreignKey: 'user_id',
                onDelete: 'CASCADE',
            })

            User.hasMany(models.AuthLog, {
                foreignKey: "user_id",
                onDelete: "CASCADE",
            });
        }
    }

    User.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            first_name: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            last_name: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            username: {
                type: DataTypes.STRING(100),
                allowNull: false
            },
            email: {
                type: DataTypes.STRING(100),
                allowNull: false
            },
            password: {
                type: DataTypes.STRING(60),
                allowNull: false
            },
            is_2fa_enabled: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            is_suspended: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
                allowNull: false
            },
            is_deleted: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            is_banned: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            },
        },
        {
            sequelize,
            modelName: "User",
            tableName: "users",
            underscored: true,
            timestamps: false,
        }
    );

    return User;
};
