'use strict'

const WALL = 'WALL'
const FLOOR = 'FLOOR'
const BALL = 'BALL'
const GAMER = 'GAMER'
const GLUE = 'GLUE'

const GAMER_GLUE_IMG = '<img src="img/gamer-purple.png">'
const GAMER_IMG = '<img src="img/gamer.png">'
const BALL_IMG = '<img src="img/ball.png">'
const GLUE_IMG = '<img src="img/candy.png">'
const AUDIO_COLLECT = new Audio('audio/ball.mp3')


// Model:
var gBoard
var gGamerPos
var gBallCount
var gIsGlued

var gBallInterval
var gGlueInterval

function onInitGame() {
	document.querySelector('.restart-btn').hidden = true

	gIsGlued = false
	gGamerPos = { i: 2, j: 9 }
	gBallCount = 0
	gBoard = buildBoard()
	renderBoard(gBoard)

	gBallInterval = setInterval(addBall, 5000)
	gGlueInterval = setInterval(addGlue, 5000)
}

function buildBoard() {
	//  Create the Matrix 10 * 12 
	const board = createMat(10, 12)
	// Put FLOOR everywhere and WALL at edges
	for (var i = 0; i < board.length; i++) {
		for (var j = 0; j < board[i].length; j++) {
			board[i][j] = { type: FLOOR, gameElement: null }

			if (i === 0 || j === 0 ||
				i === board.length - 1 || j === board[i].length - 1) {
				board[i][j].type = WALL
			}
		}
	}

	// Helpers - imporved READABILTY
	const lastRowIdx = board.length - 1
	const lastColumnIdx = board[0].length - 1
	const midRowIdx = Math.ceil(lastRowIdx / 2)
	const midColumnIdx = Math.floor(lastColumnIdx / 2)


	// Placing passages
	board[0][midColumnIdx].type = FLOOR
	board[lastRowIdx][midColumnIdx].type = FLOOR

	board[midRowIdx][0].type = FLOOR
	board[midRowIdx][lastColumnIdx].type = FLOOR

	// Place the gamer and two balls
	board[gGamerPos.i][gGamerPos.j].gameElement = GAMER

	board[2][5].gameElement = BALL
	board[5][2].gameElement = BALL
	updateBallCount(2)
	updateNegBallCount(gGamerPos, board)

	return board
}

// Render the board to an HTML table
function renderBoard(board) {

	var strHTML = ''
	for (var i = 0; i < board.length; i++) {
		strHTML += '<tr>\n'
		for (var j = 0; j < board[0].length; j++) {
			const currCell = board[i][j]

			var cellClass = getClassName({ i: i, j: j }) // cell-0-0

			if (currCell.type === FLOOR) cellClass += ' floor' // cell-0-0 floor
			else if (currCell.type === WALL) cellClass += ' wall'

			strHTML += `\t<td class="cell ${cellClass}"  onclick="moveTo(${i},${j})" >\n`

			if (currCell.gameElement === GAMER) {
				strHTML += GAMER_IMG
			} else if (currCell.gameElement === BALL) {
				strHTML += BALL_IMG
			}

			strHTML += '\t</td>\n'
		}
		strHTML += '</tr>\n'
	}
	// console.log('strHTML is:')
	console.log(strHTML)
	const elBoard = document.querySelector('.board')
	elBoard.innerHTML = strHTML
}

// Move the player to a specific location
function moveTo(i, j) {
	if (gIsGlued) return

	const lastRowIdx = gBoard.length - 1
	const lastColIdx = gBoard[0].length - 1

	// If going through passeges by keyboard(beyond the mat borders) -> handle next location
	if (j < 0) j = lastColIdx
	if (j > lastColIdx) j = 0
	if (i < 0) i = lastRowIdx
	if (i > lastRowIdx) i = 0

	// Calculate distance to make sure we are moving to a neighbor cell
	const iAbsDiff = Math.abs(i - gGamerPos.i)
	const jAbsDiff = Math.abs(j - gGamerPos.j)

	// If the clicked Cell is one of the four allowed OR edged (The last row IDX is also the furthest distance possible)
	if (iAbsDiff + jAbsDiff === 1 || iAbsDiff === lastRowIdx || jAbsDiff === lastColIdx) {
		const targetCell = gBoard[i][j]

		if (targetCell.type === WALL) return
		if (targetCell.gameElement === BALL) {
			updateBallCount(-1)
			AUDIO_COLLECT.play()
			checkVictory()
		} else if (targetCell.gameElement === GLUE) {
			gIsGlued = true

			setTimeout(() => {
				gIsGlued = false
				renderCell(gGamerPos, GAMER_IMG)
			}, 3000)
		}

		// Move the gamer
		gBoard[gGamerPos.i][gGamerPos.j].gameElement = null
		renderCell(gGamerPos, '')

		gGamerPos = { i: i, j: j }
		gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER
		renderCell(gGamerPos, (gIsGlued) ? GAMER_GLUE_IMG : GAMER_IMG)

		// Check for neighbours
		updateNegBallCount(gGamerPos, gBoard)

	} else console.log('TOO FAR', iAbsDiff, jAbsDiff)

}

// Convert a location object {i, j} to a selector and render a value in that element
function renderCell(location, value) {
	const cellSelector = `.${getClassName(location)}` //.cell-0-0
	const elCell = document.querySelector(cellSelector)
	elCell.innerHTML = value
}

// Move the player by keyboard arrows
function onKey(ev) {

	const i = gGamerPos.i
	const j = gGamerPos.j

	switch (ev.key) {
		case 'ArrowLeft':
			moveTo(i, j - 1)
			break
		case 'ArrowRight':
			moveTo(i, j + 1)
			break
		case 'ArrowUp':
			moveTo(i - 1, j)
			break
		case 'ArrowDown':
			moveTo(i + 1, j)
			break
	}
}

// Returns the class name for a specific cell
function getClassName(location) {
	const cellClass = `cell-${location.i}-${location.j}`
	return cellClass
}

// Maybe could be joined into 1 function with conditions.. but seperate is easier to handle at this point 
function addBall() {
	const emptyCell = getEmptyCell(gBoard)
	if (emptyCell === null) return
	gBoard[emptyCell.i][emptyCell.j].gameElement = BALL //model
	renderCell(emptyCell, BALL_IMG) //dom

	updateBallCount(1)
	updateNegBallCount(gGamerPos, gBoard)
}

function addGlue() {
	const emptyCell = getEmptyCell(gBoard)
	if (emptyCell === null) return
	gBoard[emptyCell.i][emptyCell.j].gameElement = GLUE
	renderCell(emptyCell, GLUE_IMG)

	setTimeout(() => {
		if (gIsGlued) return
		gBoard[emptyCell.i][emptyCell.j].gameElement = null
		renderCell(emptyCell, '')
	}, 3000)
}

function getEmptyCell(board) {
	const emptyCells = []

	for (var i = 0; i < board.length; i++) {
		for (var j = 0; j < board[i].length; j++) {
			const currCell = board[i][j]
			if (currCell.type === FLOOR && currCell.gameElement === null)
				emptyCells.push({ i, j })
		}
	}

	if (emptyCells.length === 0) return null

	const randomIdx = getRandomInt(0, emptyCells.length - 1)
	return emptyCells[randomIdx]
}

function checkVictory() {
	if (gBallCount > 0) return

	clearInterval(gBallInterval)
	clearInterval(gGlueInterval)

	gIsGlued = true
	document.querySelector('.restart-btn').hidden = false

}

function updateBallCount(diff) {
	gBallCount += diff
	document.querySelector('h2 span').innerText = gBallCount
}

function updateNegBallCount(gamerPos, board) {
	const negBallCount = countNegBalls(gamerPos.i, gamerPos.j, board)
	document.querySelector('h3 span').innerText = negBallCount
}

function countNegBalls(cellI, cellJ, board) {
	var negBallCount = 0
	for (var i = cellI - 1; i <= cellI + 1; i++) {
		if (i < 0 || i >= board.length) continue
		for (var j = cellJ - 1; j <= cellJ + 1; j++) {
			if (j < 0 || j >= board[i].length) continue
			if (i === cellI && j === cellJ) continue
			if (board[i][j].gameElement === BALL) negBallCount++
		}
	}
	return negBallCount
}