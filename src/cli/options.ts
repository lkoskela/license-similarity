import { isFile } from "../filesystem/file-utils"


export type CLIOptions = {
    command: string,
    options: string[],
    inputfile: string,
}

export type CommandOption = {
    name: string,
    flags: string[],
    description: string
}

export type Command = {
    name: string,
    flags: string[],
    commandOptions?: CommandOption[],
    description: string
}

const commands: Command[] = [
    {
        name: 'identify',
        flags: ['-i', '--identify'],
        commandOptions: [
            {
                name: 'all',
                flags: ['-a', '--all'],
                description: 'Produce all matches (if there are multiple)'
            },
        ],
        description: 'Identify a license from a source file'
    },
    {
        name: 'allmatches',
        flags: ['-a', '--all'],
        commandOptions: [],
        description: 'Identify a license from a source file'
    },
    {
        name: 'extract',
        flags: ['-x', '--extract'],
        description: 'Extract potential license text from a source file',
        commandOptions: [],
    },
]

const longestFlagCombination = Math.max(...commands.map(cmd => {
    const optionsLength = Math.max(...(cmd.commandOptions || []).map(opt => opt.flags.join(', ').length))
    const commandLength = cmd.flags.join(', ').length
    return Math.max(optionsLength, commandLength)
}))

export const usage = (nameOfExecutable: string, errorMessage?: string): string => {
    const rows: string[] = []
    if (errorMessage) {
        rows.push(errorMessage)
        rows.push('')
    }
    rows.push(`Usage:  ${nameOfExecutable} [command] [options] FILE`)
    rows.push('')
    rows.push('Commands:')
    commands.forEach(cmd => {
        rows.push(`\n${cmd.flags.join(', ').padEnd(longestFlagCombination + 4)}\t${cmd.description}`)
        if (cmd.commandOptions && cmd.commandOptions.length > 0) {
            rows.push('\n  Options:')
            cmd.commandOptions.forEach(opt => {
                rows.push(`  ${opt.flags.join(', ').padEnd(longestFlagCombination)}\t${opt.description}`)
            })
        }
    })
    rows.push('')
    return rows.join('\n')
}

export const parseCLIOptions = (args: string[]): CLIOptions => {
    let params = [...args]

    // Start by creating a default boilerplate for options that we'll then populate below
    let selectedCommand = commands[0]
    const options: CLIOptions = {
        command: selectedCommand.name,
        options: [],
        inputfile: ''
    }

    // First, check if the command was provided explicitly:
    const explicitCommand = commands.find(cmd => cmd.flags.includes(params[0]))
    if (explicitCommand) {
        selectedCommand = explicitCommand
        options.command = selectedCommand.name
        params = params.slice(1)
    }

    // Then, consume any command-specific options:
    while (params[0] && params[0].startsWith('-')) {
        const commandOption = (selectedCommand.commandOptions || []).find(opt => opt.flags.includes(params[0]))
        if (commandOption) {
            options.options.push(commandOption.name)
            params = params.slice(1)
        } else {
            throw new Error(`Option ${params[0]} is not supported by the ${selectedCommand.name} command.`)
        }
    }
    if (params.length > 1) {
        throw new Error(`Single input file required`)
    }
    if (params.length > 0) {
        options.inputfile = params[0]
        if (!isFile(options.inputfile)) {
            throw new Error(`Not a file: ${options.inputfile}`)
        }
    }
    return options
}
