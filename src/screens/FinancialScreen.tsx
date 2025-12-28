import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    TextInput,
    Modal,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spacing, FontSize, FontWeight, BorderRadius, Currency } from '../constants/theme';
import { EXPENSE_CATEGORIES, XP_CONFIG } from '../constants/gamification';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Button, Card } from '../components';
import { Expense } from '../types';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export function FinancialScreen() {
    const { state, dispatch, addXP } = useApp();
    const { colors, styleConfig } = useTheme();
    const { financial } = state;
    const [showAddModal, setShowAddModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(EXPENSE_CATEGORIES[0]);

    const today = format(new Date(), 'yyyy-MM-dd');
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());

    // Calculate monthly stats
    const monthlyExpenses = financial.expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
    });
    const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Group expenses by category
    const categoryTotals = EXPENSE_CATEGORIES.map(cat => {
        const total = monthlyExpenses
            .filter(e => e.category === cat.id)
            .reduce((sum, e) => sum + e.amount, 0);
        return { ...cat, total };
    }).filter(c => c.total > 0);

    const handleAddExpense = () => {
        if (!amount || parseFloat(amount) <= 0) return;

        const newExpense: Expense = {
            id: Date.now().toString(),
            amount: parseFloat(amount),
            category: selectedCategory.id,
            description: description || selectedCategory.name,
            date: today,
            createdAt: new Date().toISOString(),
        };

        dispatch({ type: 'ADD_EXPENSE', payload: newExpense });
        addXP(XP_CONFIG.rewards.logExpense);

        setAmount('');
        setDescription('');
        setShowAddModal(false);
    };

    const recentExpenses = financial.expenses.slice(0, 10);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>Financial</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Track your spending</Text>
                </View>

                {/* Monthly Overview */}
                <View style={[styles.overviewCard, { backgroundColor: colors.surface, borderColor: colors.financial + '30', borderRadius: styleConfig.borderRadius.md }]}>
                    <View style={styles.overviewHeader}>
                        <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>This Month</Text>
                        <Text style={[styles.overviewMonth, { color: colors.financial }]}>{format(new Date(), 'MMMM yyyy')}</Text>
                    </View>
                    <Text style={[styles.overviewAmount, { color: colors.textPrimary }]}>{Currency.format(monthlyTotal)}</Text>
                    <Text style={[styles.overviewSubtext, { color: colors.textSecondary }]}>
                        {monthlyExpenses.length} transactions
                    </Text>

                    {financial.monthlyBudget > 0 && (
                        <View style={styles.budgetProgress}>
                            <View style={styles.budgetHeader}>
                                <Text style={[styles.budgetLabel, { color: colors.textSecondary }]}>Budget</Text>
                                <Text style={[styles.budgetAmount, { color: colors.textSecondary }]}>
                                    {Currency.format(monthlyTotal)} / {Currency.format(financial.monthlyBudget)}
                                </Text>
                            </View>
                            <View style={[styles.budgetBar, { backgroundColor: colors.surfaceLighter }]}>
                                <View
                                    style={[
                                        styles.budgetFill,
                                        {
                                            width: `${Math.min((monthlyTotal / financial.monthlyBudget) * 100, 100)}%`,
                                            backgroundColor: monthlyTotal > financial.monthlyBudget ? colors.error : colors.financial,
                                        },
                                    ]}
                                />
                            </View>
                        </View>
                    )}
                </View>

                {/* Add Expense Button */}
                <Button
                    title="Add Expense"
                    onPress={() => setShowAddModal(true)}
                    color={colors.financial}
                    style={styles.addButton}
                />

                {/* Category Breakdown */}
                {categoryTotals.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Spending by Category</Text>
                        {categoryTotals.map(cat => (
                            <View key={cat.id} style={styles.categoryItem}>
                                <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                                    <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                                </View>
                                <View style={styles.categoryInfo}>
                                    <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{cat.name}</Text>
                                    <View style={[styles.categoryBar, { backgroundColor: colors.surfaceLighter }]}>
                                        <View
                                            style={[
                                                styles.categoryFill,
                                                {
                                                    width: `${(cat.total / monthlyTotal) * 100}%`,
                                                    backgroundColor: cat.color,
                                                },
                                            ]}
                                        />
                                    </View>
                                </View>
                                <Text style={[styles.categoryAmount, { color: colors.textSecondary }]}>{Currency.format(cat.total)}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Recent Transactions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Transactions</Text>
                    {recentExpenses.length > 0 ? (
                        recentExpenses.map(expense => {
                            const category = EXPENSE_CATEGORIES.find(c => c.id === expense.category);
                            return (
                                <View key={expense.id} style={[styles.transactionItem, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}>
                                    <View style={[styles.transactionIcon, { backgroundColor: (category?.color || colors.textMuted) + '20' }]}>
                                        <Text>{category?.icon || '📦'}</Text>
                                    </View>
                                    <View style={styles.transactionInfo}>
                                        <Text style={[styles.transactionDesc, { color: colors.textPrimary }]}>{expense.description}</Text>
                                        <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>{format(new Date(expense.date), 'MMM d, yyyy')}</Text>
                                    </View>
                                    <Text style={[styles.transactionAmount, { color: colors.error }]}>-{Currency.format(expense.amount)}</Text>
                                </View>
                            );
                        })
                    ) : (
                        <Card style={styles.emptyCard}>
                            <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No expenses logged yet</Text>
                            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Tap "Add Expense" to start tracking!</Text>
                        </Card>
                    )}
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Add Expense Modal */}
            <Modal
                visible={showAddModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowAddModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: styleConfig.borderRadius.lg }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Expense</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Amount Input */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount</Text>
                            <View style={[styles.amountInput, { backgroundColor: colors.surfaceLight, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}>
                                <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>₹</Text>
                                <TextInput
                                    style={[styles.amountField, { color: colors.textPrimary }]}
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="decimal-pad"
                                    placeholder="0.00"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>
                        </View>

                        {/* Category Selection */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.categoryList}>
                                    {EXPENSE_CATEGORIES.map(cat => (
                                        <TouchableOpacity
                                            key={cat.id}
                                            style={[
                                                styles.categoryOption,
                                                { backgroundColor: colors.surfaceLight, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md },
                                                selectedCategory.id === cat.id && { borderColor: cat.color, backgroundColor: cat.color + '20' },
                                            ]}
                                            onPress={() => setSelectedCategory(cat)}
                                        >
                                            <Text style={styles.categoryOptionIcon}>{cat.icon}</Text>
                                            <Text style={[styles.categoryOptionName, { color: colors.textPrimary }]}>{cat.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>

                        {/* Description Input */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Description (optional)</Text>
                            <TextInput
                                style={[styles.textInput, { backgroundColor: colors.surfaceLight, borderColor: colors.border, color: colors.textPrimary, borderRadius: styleConfig.borderRadius.md }]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="What did you spend on?"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        {/* Submit Button */}
                        <Button
                            title="Add Expense (+5 XP)"
                            onPress={handleAddExpense}
                            color={colors.financial}
                            disabled={!amount || parseFloat(amount) <= 0}
                            style={styles.submitButton}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: Spacing.md,
    },
    header: {
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
    },
    subtitle: {
        fontSize: FontSize.md,
        marginTop: Spacing.xs,
    },
    overviewCard: {
        padding: Spacing.lg,
        borderWidth: 1,
    },
    overviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    overviewLabel: {
        fontSize: FontSize.sm,
    },
    overviewMonth: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    overviewAmount: {
        fontSize: FontSize.xxxl,
        fontWeight: FontWeight.bold,
        marginTop: Spacing.sm,
    },
    overviewSubtext: {
        fontSize: FontSize.sm,
    },
    budgetProgress: {
        marginTop: Spacing.lg,
    },
    budgetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.xs,
    },
    budgetLabel: {
        fontSize: FontSize.sm,
    },
    budgetAmount: {
        fontSize: FontSize.sm,
    },
    budgetBar: {
        height: 8,
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
    },
    budgetFill: {
        height: '100%',
        borderRadius: BorderRadius.full,
    },
    addButton: {
        marginTop: Spacing.lg,
    },
    section: {
        marginTop: Spacing.xl,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        marginBottom: Spacing.md,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    categoryIcon: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryEmoji: {
        fontSize: 20,
    },
    categoryInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    categoryName: {
        fontSize: FontSize.sm,
        marginBottom: Spacing.xs,
    },
    categoryBar: {
        height: 6,
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
    },
    categoryFill: {
        height: '100%',
        borderRadius: BorderRadius.full,
    },
    categoryAmount: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        marginLeft: Spacing.md,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    transactionInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    transactionDesc: {
        fontSize: FontSize.md,
    },
    transactionDate: {
        fontSize: FontSize.sm,
        marginTop: 2,
    },
    transactionAmount: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    emptyCard: {
        alignItems: 'center',
        padding: Spacing.xl,
    },
    emptyText: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.medium,
    },
    emptySubtext: {
        fontSize: FontSize.sm,
        marginTop: Spacing.xs,
    },
    bottomPadding: {
        height: 100,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        padding: Spacing.lg,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    modalTitle: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
    },
    modalClose: {
        fontSize: FontSize.xl,
        padding: Spacing.sm,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    inputLabel: {
        fontSize: FontSize.sm,
        marginBottom: Spacing.sm,
    },
    amountInput: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        borderWidth: 1,
    },
    currencySymbol: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
    },
    amountField: {
        flex: 1,
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        paddingVertical: Spacing.md,
        marginLeft: Spacing.sm,
    },
    categoryList: {
        flexDirection: 'row',
        paddingVertical: Spacing.xs,
    },
    categoryOption: {
        alignItems: 'center',
        padding: Spacing.md,
        borderWidth: 1,
        marginRight: Spacing.sm,
        minWidth: 80,
    },
    categoryOptionIcon: {
        fontSize: 24,
        marginBottom: Spacing.xs,
    },
    categoryOptionName: {
        fontSize: FontSize.xs,
        textAlign: 'center',
    },
    textInput: {
        padding: Spacing.md,
        fontSize: FontSize.md,
        borderWidth: 1,
    },
    submitButton: {
        marginTop: Spacing.md,
    },
});
