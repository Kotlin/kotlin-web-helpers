import {escapeRegExp, startsWith, trim} from "./utils";
import {KotlinTestRunner} from "./KotlinTestRunner";

export interface KotlinTestsFilter {
    mayContainTestsFromSuite(fqn: string, alternativeFqn?: string): boolean;

    containsTest(fqn: string, alternativeFqn?: string): boolean;
}

export function runWithFilter(
    runner: KotlinTestRunner,
    filter: KotlinTestsFilter,
): KotlinTestRunner {
    let path: string[] = [];

    function jsClassName() {
        // skip root
        if (!path[0]) {
            return path.slice(1).join('.')
        }

        return path.join('.')
    }

    // In Java (Gradle, IDEA) inner classes uses `$` as separator
    function javaClassName() {
        const javaClassName = `${path.slice(1).join('$')}`;

        // skip root
        if (!path[0]) {
            return javaClassName
        }

        if (!javaClassName) {
            return path[0]
        }

        return `${path[0]}.${javaClassName}`
    }

    return {
        suite: function (name: string, isIgnored: boolean, fn: () => void) {
            path.push(name);

            try {
                if (path.length > 0 && !filter.mayContainTestsFromSuite(jsClassName(), javaClassName())) {
                    return;
                }

                runner.suite(name, isIgnored, fn);
            } finally {
                path.pop()
            }
        },

        test: function (name: string, isIgnored: boolean, fn: () => void) {
            try {
                if (!filter.containsTest(`${jsClassName()}.${name}`, `${javaClassName()}.${name}`))
                    return;

                runner.test(name, isIgnored, fn);
            } finally {
            }
        }
    };
}

export function newKotlinTestsFilter(wildcard: string | null): KotlinTestsFilter | null {
    if (wildcard == null) return null;
    wildcard = trim(wildcard);
    wildcard = wildcard.replace(/\*+/, '*'); // ** => *
    if (wildcard.length == 0) return null;
    else if (wildcard == '*') return allTest;
    else if (wildcard.indexOf('*') == -1) return new ExactFilter(wildcard);
    else if (startsWith(wildcard, '*')) return new RegExpKotlinTestsFilter(wildcard);
    else {
        // optimize for cases like "Something*", "Something*a*b" and so on.
        // by adding explicit prefix matcher to not visit unneeded suites
        // (RegExpKotlinTestsFilter doesn't support suites matching)
        const [prefix, rest] = wildcard.split('*', 2);
        return new StartsWithFilter(prefix, rest ? new RegExpKotlinTestsFilter(wildcard) : null)
    }
}

export const allTest = new class implements KotlinTestsFilter {
    mayContainTestsFromSuite(fqn: string): boolean {
        return true;
    }

    containsTest(fqn: string): boolean {
        return true;
    }
};

export class StartsWithFilter implements KotlinTestsFilter {
    constructor(
        public readonly prefix: string,
        public readonly filter: RegExpKotlinTestsFilter | null
    ) {
    }

    mayContainTestsFromSuite(fqn: string): boolean {
        return startsWith(this.prefix, fqn)
            || startsWith(fqn, this.prefix);
    }

    containsAllTestsFromSuite(fqn: string): boolean {
        return this.filter == null && startsWith(fqn, this.prefix);
    }

    containsTest(fqn: string): boolean {
        return startsWith(fqn, this.prefix)
            && (this.filter == null || this.filter.containsTest(fqn));
    }
}

export class ExactFilter implements KotlinTestsFilter {
    private readonly classNameOnlyRegExp: RegExp;

    constructor(public fqn: string) {
        // Exact filter by class name only
        this.classNameOnlyRegExp = RegExp(`^${escapeRegExp(this.fqn + ".")}[^\.]+$`);
    }

    mayContainTestsFromSuite(fqn: string): boolean {
        return startsWith(this.fqn, fqn);
    }

    containsTest(fqn: string): boolean {
        if (fqn === this.fqn) {
            return true
        }

        return this.classNameOnlyRegExp.test(fqn)
    }
}

export class RegExpKotlinTestsFilter implements KotlinTestsFilter {
    public readonly regexp: RegExp;

    constructor(wildcard: string) {
        this.regexp = RegExp("^" + wildcard
            .split('*')
            .map(it => escapeRegExp(it))
            .join('.*') + "$"
        );
    }

    mayContainTestsFromSuite(fqn: string): boolean {
        return true
    }

    containsTest(fqn: string): boolean {
        return this.regexp!.test(fqn)
    }

    toString(): string {
        return this.regexp.toString()
    }
}

export class CompositeTestFilter implements KotlinTestsFilter {
    private readonly excludePrefix: StartsWithFilter[] = [];

    constructor(
        public include: KotlinTestsFilter[],
        public exclude: KotlinTestsFilter[]
    ) {
        this.exclude.forEach(it => {
            if (it instanceof StartsWithFilter && it.filter == null)
                this.excludePrefix.push(it)
        })
    }

    mayContainTestsFromSuite(fqn: string, alternativeFqn: string): boolean {
        for (const excl of this.excludePrefix) {
            if (excl.containsAllTestsFromSuite(fqn) || excl.containsAllTestsFromSuite(alternativeFqn)) {
                return false
            }
        }
        for (const incl of this.include) {
            if (incl.mayContainTestsFromSuite(fqn) || incl.mayContainTestsFromSuite(alternativeFqn)) {
                return true
            }
        }
        return false;
    }

    containsTest(fqn: string, alternativeFqn: string): boolean {
        for (const excl of this.exclude) {
            if (excl.containsTest(fqn) || excl.containsTest(alternativeFqn)) return false
        }
        for (const incl of this.include) {
            if (incl.containsTest(fqn) || incl.containsTest(alternativeFqn)) return true
        }
        return false
    }
}