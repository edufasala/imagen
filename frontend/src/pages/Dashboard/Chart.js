import React, { useState, useEffect } from "react";
import { useTheme, makeStyles } from "@material-ui/core/styles";
import {
	BarChart,
	CartesianGrid,
	Bar,
	XAxis,
	YAxis,
	Label,
	ResponsiveContainer,
	Text,
	PieChart,
	Pie,
	Cell,
	Tooltip,
	Legend,
} from "recharts";
import { startOfHour, parseISO, format } from "date-fns";
import TextField from "@material-ui/core/TextField";
import { i18n } from "../../translate/i18n";
import Title from "./Title";
import useTickets from "../../hooks/useTickets";

const useStyles = makeStyles((theme) => ({
	fullWidth: {
		width: "120px",
	},
}));

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF1919"];

const Chart = () => {
	const theme = useTheme();
	const classes = useStyles();
	const [selectedDate, setSelectedDate] = useState(() => {
		const currentDate = new Date();
		currentDate.setUTCHours(currentDate.getUTCHours() - 3); // Subtrai 3 horas para obter UTC-3
		return currentDate.toISOString().slice(0, 10);
	});
	const { tickets } = useTickets({ date: selectedDate });

	const [chartData, setChartData] = useState([
		{ time: "01:00", amount: 0 },
		{ time: "02:00", amount: 0 },
		{ time: "03:00", amount: 0 },
		{ time: "04:00", amount: 0 },
		{ time: "05:00", amount: 0 },
		{ time: "06:00", amount: 0 },
		{ time: "07:00", amount: 0 },
		{ time: "08:00", amount: 0 },
		{ time: "09:00", amount: 0 },
		{ time: "10:00", amount: 0 },
		{ time: "11:00", amount: 0 },
		{ time: "12:00", amount: 0 },
		{ time: "13:00", amount: 0 },
		{ time: "14:00", amount: 0 },
		{ time: "15:00", amount: 0 },
		{ time: "16:00", amount: 0 },
		{ time: "17:00", amount: 0 },
		{ time: "18:00", amount: 0 },
		{ time: "19:00", amount: 0 },
		{ time: "20:00", amount: 0 },
		{ time: "21:00", amount: 0 },
		{ time: "22:00", amount: 0 },
		{ time: "23:00", amount: 0 },
		{ time: "00:00", amount: 0 },
	]);

	useEffect(() => {
		if (tickets.length === 0) {
			setChartData(prevState => prevState.map(item => ({ ...item, amount: 0 })));
		} else {
			setChartData(prevState => {
				let aux = [...prevState];
				aux.forEach(a => {
					a.amount = 0;
					tickets.forEach(ticket => {
						if (format(startOfHour(parseISO(ticket.createdAt)), "HH:mm") === a.time) {
							a.amount++;
						}
					});
				});
				return aux;
			});
		}
	}, [tickets, selectedDate]);

    const userCounts = tickets.length > 0 ? 
    tickets.reduce((counts, ticket) => {
        const userName = ticket.user ? ticket.user.name : "#N/A";
        counts[userName] = (counts[userName] || 0) + 1;
        return counts;
    }, {}) : 
    { "0": 0 }; 

    const userChartData = Object.keys(userCounts).map(user => ({
        user,
        amount: userCounts[user]
    }));

    const areaCounts = tickets.length > 0 ? 
    tickets.reduce((counts, ticket) => {
        const areaName = ticket.queue ? ticket.queue.name : "#N/A";
        counts[areaName] = (counts[areaName] || 0) + 1;
        return counts;
    }, {}) : 
    { "0": 0 }; 

    const areaChartData = Object.keys(areaCounts).map(user => ({
        user,
        amount: areaCounts[user]
    }));

	const handleDateChange = (event) => {
		setSelectedDate(event.target.value);
	};

	return (
		<React.Fragment>
			<Title>{`${i18n.t("dashboard.charts.perDay.title")}${
				tickets.length
			}`}</Title>
			<div>
				<TextField
				label="Data:"
				type="date"
				value={selectedDate}
				onChange={handleDateChange}
				className={classes.fullWidth}
				InputLabelProps={{
					shrink: true,
				}}
				/>
			</div>
			<ResponsiveContainer>
				<BarChart
					data={chartData}
					barSize={40}
					width={730}
					height={250}
					margin={{
						top: 16,
						right: 16,
						bottom: 0,
						left: 24,
					}}
				>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey="time" stroke={theme.palette.text.secondary} />
					<YAxis
						type="number"
						allowDecimals={false}
						stroke={theme.palette.text.secondary}
					>
						<Label
							angle={270}
							position="left"
							style={{ textAnchor: "middle", fill: theme.palette.text.primary }}
							offset={19}
						>
							Tickets
						</Label>
					</YAxis>
					<Bar dataKey="amount" fill={theme.palette.primary.main} />
				</BarChart>
			</ResponsiveContainer>
			<ResponsiveContainer>
                <BarChart
                    data={userChartData}
                    layout="vertical"
                    margin={{
                        top: 16,
                        right: 16,
                        bottom: 0,
                        left: 24,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" stroke={theme.palette.text.secondary} />
                    <YAxis 
						dataKey="user"
					 	type="category" 
						stroke={theme.palette.text.secondary}
					>
						<Label
							angle={270}
							position="left"
							style={{ textAnchor: "middle", fill: theme.palette.text.primary }}
							offset={19}
						>
							Usuários
						</Label>
					</YAxis>
                    <Bar dataKey="amount" fill={theme.palette.primary.main} barSize={20}>
                        {chartData.map((entry, index) => (
                            <Text
                                key={`value-${index}`}
                                x={entry.amount > 0 ? entry.amount + 5 : 0}
                                y={index}
                                dy={5}
                                fill={theme.palette.text.primary}
                                textAnchor="start"
                            >
                                {entry.amount}
                            </Text>
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
			<Title>Atendimentos por area</Title>
			<ResponsiveContainer>
				<PieChart>
					<Pie
						data={areaChartData}
						dataKey="amount"
						nameKey="user"
						fill={theme.palette.primary.main}
						innerRadius={60}
						outerRadius={80}
						label
					>
						{areaChartData.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
						))}
					</Pie>
					<Legend />
				</PieChart>
			</ResponsiveContainer>
		</React.Fragment>
	);
};

export default Chart;